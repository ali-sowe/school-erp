import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { STUDENT_MESSAGES } from "../../constants/messages/student/student.message.js";
import { AppError } from "../app-error.helper.js";
import * as studentRepository from "../../repositories/student/student.repository.js";

export async function ensureAdmissionNumberIsAvailable(schoolId, admissionNumber) {
    const existing = await studentRepository.findByAdmissionNumber(schoolId, admissionNumber);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, STUDENT_MESSAGES.DUPLICATE_ADMISSION_NUMBER);
    }
}

// Same tenant-ownership check used throughout (grade-level.helper.js,
// class.helper.js): every read of a specific student is checked here so no
// caller can leak another school's record just by guessing an id.
export async function findOwnedStudentOrThrow(studentId, schoolId) {
    const student = await studentRepository.findById(studentId);

    if (!student || student.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, STUDENT_MESSAGES.NOT_FOUND);
    }

    return student;
}
