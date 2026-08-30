import * as studentRepository from "../../repositories/student/student.repository.js";
import * as attendanceRepository from "../../repositories/attendance/attendance.repository.js";
import * as examResultRepository from "../../repositories/exam/exam-result.repository.js";
import * as borrowRepository from "../../repositories/library/borrow.repository.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";
import * as announcementRepository from "../../repositories/messaging/announcement.repository.js";
import * as announcementReadRepository from "../../repositories/messaging/announcement-read.repository.js";
import { findOwnedAnnouncementOrThrow } from "../../helpers/messaging/announcement.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PORTAL_MESSAGES } from "../../constants/messages/portal/portal.message.js";

// Every function below resolves "which student" from the logged-in user's
// own id via students.user_id — never from a client-supplied student_id —
// so a Student Portal login can only ever see its own records, regardless
// of what a request tries to pass in. This is deliberately a separate,
// narrower module rather than reusing student.service.js's existing
// getStudentById/getStudentAttendanceHistory: those trust students.read/
// attendance.read for ANY student in the school, which a Student account
// must never be granted (see permission.helper.js's portal.student.read).
async function resolveOwnStudentOrThrow(userId) {
    const student = await studentRepository.findByUserId(userId);

    if (!student) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, PORTAL_MESSAGES.NO_LINKED_STUDENT);
    }

    return student;
}

export async function getMyProfile(userId) {
    return await resolveOwnStudentOrThrow(userId);
}

export async function getMyAttendance(userId, filters = {}) {
    const student = await resolveOwnStudentOrThrow(userId);
    return await attendanceRepository.findForStudent(student.id, filters);
}

export async function getMyExamResults(userId, filters = {}) {
    const student = await resolveOwnStudentOrThrow(userId);
    return await examResultRepository.findForStudent(student.id, filters);
}

export async function getMyLibraryBorrows(userId, filters = {}) {
    const student = await resolveOwnStudentOrThrow(userId);
    return await borrowRepository.findForStudent(student.id, filters);
}

// Computed from the student's *current* class/grade level (their active
// enrollment), same audience rules announcement.service.js already applies
// when staff publish one — this just runs the lookup in reverse. A student
// with no active enrollment (e.g. between years) still sees SCHOOL-wide
// announcements; the CLASS/GRADE_LEVEL conditions simply never match a
// null id.
export async function getMyAnnouncements(userId, schoolId) {
    const student = await resolveOwnStudentOrThrow(userId);
    const activeEnrollment = await enrollmentRepository.findActiveForStudent(student.id);

    return await announcementRepository.findForAudience(schoolId, {
        classId: activeEnrollment?.class_id,
        gradeLevelId: activeEnrollment?.grade_level_id
    });
}

export async function markAnnouncementRead(userId, announcementId, schoolId) {
    await resolveOwnStudentOrThrow(userId);
    await findOwnedAnnouncementOrThrow(announcementId, schoolId);
    await announcementReadRepository.markAsRead(announcementId, userId);
}
