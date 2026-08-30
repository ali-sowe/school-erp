import * as guardianRepository from "../../repositories/student/guardian.repository.js";
import * as studentGuardianRepository from "../../repositories/student/student-guardian.repository.js";
import * as attendanceRepository from "../../repositories/attendance/attendance.repository.js";
import * as examResultRepository from "../../repositories/exam/exam-result.repository.js";
import * as invoiceRepository from "../../repositories/finance/invoice.repository.js";
import * as borrowRepository from "../../repositories/library/borrow.repository.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";
import * as announcementRepository from "../../repositories/messaging/announcement.repository.js";
import * as announcementReadRepository from "../../repositories/messaging/announcement-read.repository.js";
import { findOwnedAnnouncementOrThrow } from "../../helpers/messaging/announcement.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PORTAL_MESSAGES } from "../../constants/messages/portal/portal.message.js";

async function resolveOwnGuardianOrThrow(userId) {
    const guardian = await guardianRepository.findByUserId(userId);

    if (!guardian) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, PORTAL_MESSAGES.NO_LINKED_GUARDIAN);
    }

    return guardian;
}

// Every "for one child" function below checks student_guardians before
// returning anything — a parent can only ever see a student's data by
// actually being that student's linked guardian, checked fresh on every
// call rather than trusted from the URL alone.
async function ensureIsMyChild(guardianId, studentId) {
    const link = await studentGuardianRepository.findLink(studentId, guardianId);

    if (!link || link.status !== 'ACTIVE') {
        throw new AppError(HTTP_STATUS.NOT_FOUND, PORTAL_MESSAGES.CHILD_NOT_FOUND);
    }
}

export async function getMyChildren(userId) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    return await studentGuardianRepository.findStudentsForGuardian(guardian.id);
}

export async function getChildAttendance(userId, studentId, filters = {}) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    await ensureIsMyChild(guardian.id, studentId);
    return await attendanceRepository.findForStudent(studentId, filters);
}

export async function getChildExamResults(userId, studentId, filters = {}) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    await ensureIsMyChild(guardian.id, studentId);
    return await examResultRepository.findForStudent(studentId, filters);
}

export async function getChildInvoices(userId, studentId, schoolId) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    await ensureIsMyChild(guardian.id, studentId);
    return await invoiceRepository.findAll(schoolId, { studentId });
}

export async function getChildLibraryBorrows(userId, studentId, filters = {}) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    await ensureIsMyChild(guardian.id, studentId);
    return await borrowRepository.findForStudent(studentId, filters);
}

// Same reverse-audience computation as student-portal.service.js's
// getMyAnnouncements, just resolved for the specified (and
// ownership-checked) child instead of the caller themselves.
export async function getChildAnnouncements(userId, studentId, schoolId) {
    const guardian = await resolveOwnGuardianOrThrow(userId);
    await ensureIsMyChild(guardian.id, studentId);

    const activeEnrollment = await enrollmentRepository.findActiveForStudent(studentId);

    return await announcementRepository.findForAudience(schoolId, {
        classId: activeEnrollment?.class_id,
        gradeLevelId: activeEnrollment?.grade_level_id
    });
}

export async function markAnnouncementRead(userId, announcementId, schoolId) {
    await resolveOwnGuardianOrThrow(userId);
    await findOwnedAnnouncementOrThrow(announcementId, schoolId);
    await announcementReadRepository.markAsRead(announcementId, userId);
}
