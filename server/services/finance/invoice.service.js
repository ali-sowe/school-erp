import {
    validateAmount,
    findOwnedInvoiceOrThrow,
    findOwnedStudentOrThrow,
    findOwnedAcademicYearOrThrow,
    findOwnedTermOrThrow,
    findOwnedClassOrThrow
} from "../../helpers/finance/invoice.helper.js";
import { findOwnedFeeStructureOrThrow } from "../../helpers/finance/fee-structure.helper.js";
import * as invoiceRepository from "../../repositories/finance/invoice.repository.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { INVOICE_MESSAGES } from "../../constants/messages/finance/invoice.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { createApprovalRequest } from "../approval/approval.service.js";
import { registerWorkflowExecutor } from "../approval/workflow-executor-registry.js";
import { registerRequiredSteps } from "../approval/workflow-step-policy-registry.js";

async function resolveInvoiceInput(data, schoolId) {
    await findOwnedStudentOrThrow(data.student_id, schoolId);
    await findOwnedAcademicYearOrThrow(data.academic_year_id, schoolId);

    if (data.term_id) {
        await findOwnedTermOrThrow(data.term_id, schoolId);
    }

    let amountDue = data.amount_due;
    let description = data.description;

    // A fee structure is optional — an ad-hoc invoice (e.g. a one-off
    // uniform charge) can supply its own amount_due and description instead.
    if (data.fee_structure_id) {
        const feeStructure = await findOwnedFeeStructureOrThrow(data.fee_structure_id, schoolId);
        amountDue = amountDue ?? feeStructure.amount;
        description = description ?? feeStructure.name;
    }

    validateAmount(amountDue, INVOICE_MESSAGES.INVALID_AMOUNT);

    if (!description) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, INVOICE_MESSAGES.DESCRIPTION_REQUIRED);
    }

    return { ...data, amount_due: amountDue, description };
}

export async function createInvoice(data, schoolId, userId = null) {
    const resolved = await resolveInvoiceInput(data, schoolId);

    const id = await invoiceRepository.create({ ...resolved, school_id: schoolId }, userId);

    const invoice = await invoiceRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Invoice",
        entityId: id,
        action: "CREATED",
        oldValues: {},
        newValues: { amount_due: invoice.amount_due, student_id: invoice.student_id },
        reason: "Invoice created",
        performedBy: userId
    });

    return invoice;
}

// Generates one invoice per actively-enrolled student in a class, from a
// single fee structure — removes the friction of billing a whole class one
// student at a time (ERP Constitution: "remove friction from school
// administration").
export async function bulkGenerateInvoices(feeStructureId, classId, schoolId, userId = null) {
    const feeStructure = await findOwnedFeeStructureOrThrow(feeStructureId, schoolId);
    await findOwnedClassOrThrow(classId, schoolId);

    const roster = await enrollmentRepository.findRoster(classId, feeStructure.academic_year_id, 'ACTIVE');

    const invoices = [];

    for (const enrolledStudent of roster) {
        const id = await invoiceRepository.create(
            {
                school_id: schoolId,
                student_id: enrolledStudent.id,
                academic_year_id: feeStructure.academic_year_id,
                fee_structure_id: feeStructure.id,
                description: feeStructure.name,
                amount_due: feeStructure.amount
            },
            userId
        );

        invoices.push(await invoiceRepository.findById(id));
    }

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "FeeStructure",
        entityId: feeStructureId,
        action: "BULK_INVOICED",
        oldValues: {},
        newValues: { class_id: classId, invoice_count: invoices.length },
        reason: "Invoices bulk-generated for class",
        performedBy: userId
    });

    return invoices;
}

export async function getInvoices(schoolId, filters) {
    return await invoiceRepository.findAll(schoolId, filters);
}

export async function getInvoiceById(id, schoolId) {
    return await findOwnedInvoiceOrThrow(id, schoolId);
}

// Shared by the immediate void path and the approval-gated request path
// below — both need the same "can this invoice even be voided right now"
// checks before anything happens, whether that's voiding it directly or
// just opening a request to vote on.
function ensureInvoiceIsVoidable(invoice, reason) {
    if (invoice.status === "VOIDED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, INVOICE_MESSAGES.ALREADY_VOIDED);
    }

    if (Number(invoice.amount_paid) > 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, INVOICE_MESSAGES.CANNOT_VOID_WITH_PAYMENTS);
    }

    if (!reason) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, INVOICE_MESSAGES.VOID_REASON_REQUIRED);
    }
}

export async function voidInvoiceById(id, reason, schoolId, userId = null) {
    const invoice = await findOwnedInvoiceOrThrow(id, schoolId);

    ensureInvoiceIsVoidable(invoice, reason);

    const voided = await invoiceRepository.voidInvoice(id, reason);

    // Someone else's void of this exact invoice won the race between our
    // status check above and this UPDATE — same guard pattern as
    // approval.service.js's decideStep and borrow.service.js's markReturned.
    if (voided === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, INVOICE_MESSAGES.ALREADY_VOIDED);
    }

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Invoice",
        entityId: id,
        action: "VOIDED",
        oldValues: { status: invoice.status },
        newValues: { status: "VOIDED" },
        reason,
        performedBy: userId
    });

    return await invoiceRepository.findById(id);
}

// Routes the same action through the Approval Workflow Engine (ADR-004)
// instead of voiding immediately — "payments" is one of the doc's own
// examples of a decision worth a visible approval trail, e.g. a four-eyes
// check on a large void even from someone who already holds finance.write.
// The invoice is untouched until an Administrator approves *and* executes
// the request; execution is where the registered 'INVOICE_VOID' executor
// below actually calls voidInvoiceById.
// NOTE: voidInvoiceById above still exists and is reachable directly
// (PATCH .../void) behind the same finance.write permission — this is an
// additional, opt-in path, not an enforced control. Nothing currently stops
// the same person from voiding directly instead of requesting approval; if
// a real four-eyes guarantee is needed, the direct endpoint would need a
// stronger/separate permission than requestInvoiceVoid.
export async function requestInvoiceVoid(id, reason, schoolId, userId = null) {
    const invoice = await findOwnedInvoiceOrThrow(id, schoolId);

    ensureInvoiceIsVoidable(invoice, reason);

    return await createApprovalRequest(
        {
            workflow_type: 'INVOICE_VOID',
            entity_type: 'Invoice',
            entity_id: invoice.id,
            title: `Void invoice #${invoice.id} (${invoice.description})`,
            description: reason,
            steps: [{ approver_role_name: 'Administrator' }]
        },
        schoolId,
        userId
    );
}

// Registered once at module load (this file is always reached via
// app.js -> invoice.routes.js -> invoice.controller.js -> here). Runs when
// an INVOICE_VOID approval request is executed; approval.service.js knows
// nothing about invoices, only that some executor may exist for whatever
// workflow_type a request carries — see workflow-executor-registry.js.
registerWorkflowExecutor('INVOICE_VOID', async (request, schoolId, userId) => {
    await voidInvoiceById(request.entity_id, request.description || 'Approved via workflow', schoolId, userId);
});

// Enforced server-side so the POST /approval-requests endpoint can't be
// used to create an INVOICE_VOID with any approver other than an
// Administrator, no matter what steps a caller sends — see
// workflow-step-policy-registry.js.
registerRequiredSteps('INVOICE_VOID', [{ approver_role_name: 'Administrator' }]);

export async function getFeeCollectionSummary(schoolId, academicYearId) {
    await findOwnedAcademicYearOrThrow(academicYearId, schoolId);

    return await invoiceRepository.getSummary(schoolId, academicYearId);
}
