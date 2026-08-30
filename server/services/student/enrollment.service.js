import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import {
    findOwnedClassOrThrow,
    resolveAcademicYearId
} from "../../helpers/student/enrollment.helper.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { ENROLLMENT_MESSAGES } from "../../constants/messages/student/enrollment.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { createApprovalRequest } from "../approval/approval.service.js";
import { registerWorkflowExecutor } from "../approval/workflow-executor-registry.js";
import { registerRequiredSteps } from "../approval/workflow-step-policy-registry.js";

// Every read of a specific enrollment is tenant-checked here, same pattern
// as findOwnedStudentOrThrow elsewhere in this domain.
async function findOwnedEnrollmentOrThrow(id, schoolId) {
    const enrollment = await enrollmentRepository.findById(id);

    if (!enrollment || enrollment.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ENROLLMENT_MESSAGES.NOT_FOUND);
    }

    return enrollment;
}

export async function enrollStudent(studentId, data, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(studentId, schoolId);

    if (student.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.STUDENT_ARCHIVED);
    }

    const academicYearId = await resolveAcademicYearId(data.academic_year_id, schoolId);

    const classRecord = await findOwnedClassOrThrow(data.class_id, schoolId);
    if (classRecord.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.CLASS_ARCHIVED);
    }

    const existingEnrollment = await enrollmentRepository.findByStudentAndYear(studentId, academicYearId);
    if (existingEnrollment) {
        throw new AppError(HTTP_STATUS.CONFLICT, ENROLLMENT_MESSAGES.ALREADY_ENROLLED_THIS_YEAR);
    }

    const id = await enrollmentRepository.create(
        {
            school_id: schoolId,
            student_id: studentId,
            academic_year_id: academicYearId,
            class_id: classRecord.id,
            enrolled_date: data.enrolled_date || new Date().toISOString().slice(0, 10)
        },
        userId
    );

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: studentId,
        action: "ENROLLED",
        newValues: { academic_year_id: academicYearId, class_id: classRecord.id },
        reason: "Student enrolled",
        performedBy: userId
    });

    return await enrollmentRepository.findById(id);
}

export async function getEnrollmentHistory(studentId, schoolId) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    return await enrollmentRepository.findForStudent(studentId);
}

export async function getRoster(classId, academicYearId, schoolId, status) {
    await findOwnedClassOrThrow(classId, schoolId);
    const resolvedAcademicYearId = await resolveAcademicYearId(academicYearId, schoolId);

    return await enrollmentRepository.findRoster(classId, resolvedAcademicYearId, status);
}

// Shared by the immediate transfer path and the approval-gated request path
// below, same split as invoice.service.js's ensureInvoiceIsVoidable.
function ensureTransferIsValid(enrollment, newClass) {
    if (enrollment.status === "WITHDRAWN") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.CANNOT_MODIFY_WITHDRAWN);
    }

    if (enrollment.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.CANNOT_MODIFY_COMPLETED);
    }

    if (newClass.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.CLASS_ARCHIVED);
    }
}

// Mid-year section change: same academic year, new class. Distinct from a
// new academic year enrollment so a student's year-over-year history is
// never confused with an in-year move — see student_enrollments in schema.js.
export async function transferStudent(enrollmentId, newClassId, schoolId, userId = null) {
    const enrollment = await findOwnedEnrollmentOrThrow(enrollmentId, schoolId);
    const newClass = await findOwnedClassOrThrow(newClassId, schoolId);

    ensureTransferIsValid(enrollment, newClass);

    await enrollmentRepository.updateClass(enrollmentId, newClass.id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: enrollment.student_id,
        action: "TRANSFERRED",
        oldValues: { class_id: enrollment.class_id },
        newValues: { class_id: newClass.id },
        reason: "Student transferred to a different class",
        performedBy: userId
    });

    return await enrollmentRepository.findById(enrollmentId);
}

// Routes the same move through the Approval Workflow Engine (ADR-004)
// instead of transferring immediately — one of the doc's own named
// examples of a decision worth a visible approval trail. The target
// class_id doesn't fit the generic entity_id column, so it travels in
// metadata (see 015_add_metadata_to_approval_requests.sql) for the
// executor to read back at execution time.
// NOTE: transferStudent above is still reachable directly (PATCH
// .../transfer) behind the identical students.write permission — this is
// an additional, opt-in path, not an enforced four-eyes control.
export async function requestStudentTransfer(enrollmentId, newClassId, reason, schoolId, userId = null) {
    const enrollment = await findOwnedEnrollmentOrThrow(enrollmentId, schoolId);
    const newClass = await findOwnedClassOrThrow(newClassId, schoolId);

    ensureTransferIsValid(enrollment, newClass);

    const student = await findOwnedStudentOrThrow(enrollment.student_id, schoolId);

    return await createApprovalRequest(
        {
            workflow_type: 'STUDENT_TRANSFER',
            entity_type: 'Enrollment',
            entity_id: enrollment.id,
            title: `Transfer ${student.first_name} ${student.last_name} to ${newClass.name}`,
            description: reason,
            metadata: { new_class_id: newClass.id },
            steps: [{ approver_role_name: 'Administrator' }]
        },
        schoolId,
        userId
    );
}

// Registered once at module load, same pattern as invoice.service.js's
// 'INVOICE_VOID' executor. approval.service.js only knows some executor may
// exist for a workflow_type — never that enrollments/students exist at all.
registerWorkflowExecutor('STUDENT_TRANSFER', async (request, schoolId, userId) => {
    await transferStudent(request.entity_id, request.metadata.new_class_id, schoolId, userId);
});

// Enforced server-side so the POST /approval-requests endpoint can't be
// used to create a STUDENT_TRANSFER with any approver other than an
// Administrator, no matter what steps a caller sends — see
// workflow-step-policy-registry.js.
registerRequiredSteps('STUDENT_TRANSFER', [{ approver_role_name: 'Administrator' }]);

export async function withdrawStudent(enrollmentId, reason, schoolId, userId = null) {
    const enrollment = await findOwnedEnrollmentOrThrow(enrollmentId, schoolId);

    if (enrollment.status === "WITHDRAWN") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.ALREADY_WITHDRAWN);
    }

    await enrollmentRepository.setStatus(enrollmentId, "WITHDRAWN", reason ?? null);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: enrollment.student_id,
        action: "WITHDRAWN",
        oldValues: { status: enrollment.status },
        newValues: { status: "WITHDRAWN" },
        reason: reason || "Student withdrawn",
        performedBy: userId
    });

    return await enrollmentRepository.findById(enrollmentId);
}

// Marks an academic year's enrollment as finished (end of year), leaving the
// row in place as history rather than deleting it — a subsequent enrollment
// for the next academic year is a new row (promotion), per ADR-002/ADR-003.
export async function completeEnrollment(enrollmentId, schoolId, userId = null) {
    const enrollment = await findOwnedEnrollmentOrThrow(enrollmentId, schoolId);

    if (enrollment.status === "WITHDRAWN") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.CANNOT_MODIFY_WITHDRAWN);
    }

    await enrollmentRepository.setStatus(enrollmentId, "COMPLETED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: enrollment.student_id,
        action: "ENROLLMENT_COMPLETED",
        oldValues: { status: enrollment.status },
        newValues: { status: "COMPLETED" },
        reason: "Academic year enrollment completed",
        performedBy: userId
    });

    return await enrollmentRepository.findById(enrollmentId);
}
