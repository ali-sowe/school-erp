import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { FEE_STRUCTURE_MESSAGES } from "../../constants/messages/finance/fee-structure.message.js";
import { AppError } from "../app-error.helper.js";
import * as feeStructureRepository from "../../repositories/finance/fee-structure.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import * as gradeLevelRepository from "../../repositories/grade-level/grade-level.repository.js";

export async function ensureFeeStructureDoesNotExist(academicYearId, gradeLevelId, name) {
    const existing = await feeStructureRepository.findByNameInScope(academicYearId, gradeLevelId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, FEE_STRUCTURE_MESSAGES.DUPLICATE_NAME);
    }
}

export function validateAmount(amount, message) {
    if (!(amount > 0)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, message);
    }
}

// Same tenant-ownership check used throughout the codebase (student.helper.js,
// class.helper.js): every read of a specific fee structure is checked here.
export async function findOwnedFeeStructureOrThrow(feeStructureId, schoolId) {
    const feeStructure = await feeStructureRepository.findById(feeStructureId);

    if (!feeStructure || feeStructure.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, FEE_STRUCTURE_MESSAGES.NOT_FOUND);
    }

    return feeStructure;
}

export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, FEE_STRUCTURE_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}

export async function findOwnedGradeLevelOrThrow(gradeLevelId, schoolId) {
    const gradeLevel = await gradeLevelRepository.findById(gradeLevelId);

    if (!gradeLevel || gradeLevel.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, FEE_STRUCTURE_MESSAGES.GRADE_LEVEL_NOT_FOUND);
    }

    return gradeLevel;
}
