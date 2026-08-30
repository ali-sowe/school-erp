import { validateAmount, findOwnedPaymentOrThrow } from "../../helpers/finance/payment.helper.js";
import { findOwnedInvoiceOrThrow } from "../../helpers/finance/invoice.helper.js";
import * as paymentRepository from "../../repositories/finance/payment.repository.js";
import * as invoiceRepository from "../../repositories/finance/invoice.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { PAYMENT_MESSAGES } from "../../constants/messages/finance/payment.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { transaction } from "../../database/transaction.js";
import { createApprovalRequest } from "../approval/approval.service.js";
import { registerWorkflowExecutor } from "../approval/workflow-executor-registry.js";
import { registerRequiredSteps } from "../approval/workflow-step-policy-registry.js";

export async function recordPayment(invoiceId, data, schoolId, userId = null) {
    const invoice = await findOwnedInvoiceOrThrow(invoiceId, schoolId);

    if (invoice.status === "VOIDED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.INVOICE_VOIDED);
    }

    validateAmount(data.amount, PAYMENT_MESSAGES.INVALID_AMOUNT);

    // The payment row and the invoice's recalculated balance/status must
    // never be visible out of sync with each other — one transaction. The
    // overpayment check is re-run in here (not just above) against a
    // row-locked read: two concurrent payments against the same invoice
    // would otherwise both validate against the same stale amount_paid and
    // together overpay it. The check above is just a fast, pre-transaction
    // fail for the common case; this one is the one that actually holds.
    const paymentId = await transaction(async (connection) => {
        const lockedInvoice = await invoiceRepository.findByIdForUpdate(invoiceId, connection);

        if (lockedInvoice.status === "VOIDED") {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.INVOICE_VOIDED);
        }

        const remainingBalance = Number(lockedInvoice.amount_due) - Number(lockedInvoice.amount_paid);
        if (Number(data.amount) > remainingBalance) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.EXCEEDS_BALANCE);
        }

        const newPaymentId = await paymentRepository.create(
            { ...data, invoice_id: invoiceId, school_id: schoolId },
            userId,
            connection
        );

        await invoiceRepository.recalculateBalance(invoiceId, connection);

        return newPaymentId;
    });

    const payment = await paymentRepository.findById(paymentId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Payment",
        entityId: paymentId,
        action: "RECORDED",
        oldValues: {},
        newValues: { amount: payment.amount, invoice_id: invoiceId },
        reason: "Payment recorded",
        performedBy: userId
    });

    return payment;
}

export async function getPaymentsForInvoice(invoiceId, schoolId) {
    await findOwnedInvoiceOrThrow(invoiceId, schoolId);

    return await paymentRepository.findForInvoice(invoiceId);
}

// Shared by the immediate void path and the approval-gated request path
// below, same split as invoice.service.js's ensureInvoiceIsVoidable.
function ensurePaymentIsVoidable(payment, reason) {
    if (payment.status === "VOIDED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.ALREADY_VOIDED);
    }

    if (!reason) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.VOID_REASON_REQUIRED);
    }
}

export async function voidPaymentById(id, reason, schoolId, userId = null) {
    const payment = await findOwnedPaymentOrThrow(id, schoolId);

    ensurePaymentIsVoidable(payment, reason);

    await transaction(async (connection) => {
        const voided = await paymentRepository.voidPayment(id, reason, connection);

        // Same guard pattern as invoice void/borrow return: someone else's
        // void of this exact payment won the race, so don't also recalculate
        // the invoice balance for a void that didn't really win.
        if (voided === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, PAYMENT_MESSAGES.ALREADY_VOIDED);
        }

        await invoiceRepository.recalculateBalance(payment.invoice_id, connection);
    });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Payment",
        entityId: id,
        action: "VOIDED",
        oldValues: { status: payment.status },
        newValues: { status: "VOIDED" },
        reason,
        performedBy: userId
    });

    return await paymentRepository.findById(id);
}

// Routes the same action through the Approval Workflow Engine (ADR-004),
// same reasoning as invoice.service.js's requestInvoiceVoid — a four-eyes
// check on reversing money already recorded as received, even for someone
// who already holds finance.write. The payment (and the invoice balance it
// affects) stay untouched until an Administrator approves and executes.
// NOTE: same caveat as requestInvoiceVoid — voidPaymentById is still
// reachable directly (PATCH .../void) behind the identical finance.write
// permission, so this is an additional, opt-in path rather than something
// that actually prevents the same person from voiding directly instead.
export async function requestPaymentVoid(id, reason, schoolId, userId = null) {
    const payment = await findOwnedPaymentOrThrow(id, schoolId);

    ensurePaymentIsVoidable(payment, reason);

    return await createApprovalRequest(
        {
            workflow_type: 'PAYMENT_VOID',
            entity_type: 'Payment',
            entity_id: payment.id,
            title: `Void payment #${payment.id} (${payment.amount})`,
            description: reason,
            steps: [{ approver_role_name: 'Administrator' }]
        },
        schoolId,
        userId
    );
}

// Registered once at module load, same pattern as invoice.service.js's
// 'INVOICE_VOID' executor. approval.service.js only knows some executor may
// exist for a workflow_type — never that payments exist at all.
registerWorkflowExecutor('PAYMENT_VOID', async (request, schoolId, userId) => {
    await voidPaymentById(request.entity_id, request.description || 'Approved via workflow', schoolId, userId);
});

// Enforced server-side so the POST /approval-requests endpoint can't be
// used to create a PAYMENT_VOID with any approver other than an
// Administrator, no matter what steps a caller sends — see
// workflow-step-policy-registry.js.
registerRequiredSteps('PAYMENT_VOID', [{ approver_role_name: 'Administrator' }]);
