import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_MESSAGES } from "../../constants/messages/teacher/teacher.message.js";
import { AppError } from "../app-error.helper.js";
import * as teacherRepository from "../../repositories/teacher/teacher.repository.js";

export async function ensureEmployeeNumberIsAvailable(schoolId, employeeNumber) {
    const existing = await teacherRepository.findByEmployeeNumber(schoolId, employeeNumber);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, TEACHER_MESSAGES.DUPLICATE_EMPLOYEE_NUMBER);
    }
}

// Same tenant-ownership check used throughout (student.helper.js,
// class.helper.js): every read of a specific teacher is checked here so no
// caller can leak another school's record just by guessing an id.
export async function findOwnedTeacherOrThrow(teacherId, schoolId) {
    const teacher = await teacherRepository.findById(teacherId);

    if (!teacher || teacher.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TEACHER_MESSAGES.NOT_FOUND);
    }

    return teacher;
}
