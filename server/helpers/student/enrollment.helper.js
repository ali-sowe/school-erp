import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ENROLLMENT_MESSAGES } from "../../constants/messages/student/enrollment.message.js";
import { AppError } from "../app-error.helper.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import * as classRepository from "../../repositories/class/class.repository.js";

export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ENROLLMENT_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}

export async function findOwnedClassOrThrow(classId, schoolId) {
    const classRecord = await classRepository.findById(classId);

    if (!classRecord || classRecord.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ENROLLMENT_MESSAGES.CLASS_NOT_FOUND);
    }

    return classRecord;
}

// Resolves which academic year an enrollment should use when the caller
// doesn't specify one: the school's currently ACTIVE year, per the Calendar
// Engine doc ("the foundation used by multiple school processes"). Requiring
// an explicit id otherwise, rather than guessing, keeps enrollment from
// silently attaching to the wrong year.
export async function resolveAcademicYearId(academicYearId, schoolId) {
    if (academicYearId) {
        const academicYear = await findOwnedAcademicYearOrThrow(academicYearId, schoolId);
        return academicYear.id;
    }

    const activeYear = await academicYearRepository.findActive(schoolId);

    if (!activeYear) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ENROLLMENT_MESSAGES.NO_ACTIVE_ACADEMIC_YEAR);
    }

    return activeYear.id;
}
