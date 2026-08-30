import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_SUBJECT_ASSIGNMENT_MESSAGES } from "../../constants/messages/teacher/teacher-subject-assignment.message.js";
import { AppError } from "../app-error.helper.js";
import { findOwnedTeacherOrThrow } from "./teacher.helper.js";

// A teacher must exist for this school AND be active to take on (or keep)
// an assignment — mirrors ENROLLMENT_MESSAGES.STUDENT_ARCHIVED: an archived
// record shouldn't silently pick up new responsibilities.
export async function findActiveOwnedTeacherOrThrow(teacherId, schoolId) {
    const teacher = await findOwnedTeacherOrThrow(teacherId, schoolId);

    if (teacher.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.TEACHER_ARCHIVED);
    }

    return teacher;
}
