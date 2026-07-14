import { ensureAcademicYearDoesNotExist, validateAcademicYearDates } from "../../helpers/academic-year/academic-year.helper.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { ACADEMIC_YEAR_MESSAGES } from "../../constants/messages/academic-year/academic-year.message.js";
import { HTTP_STATUS } from "../../constants/httpstatus.js";

export async function createAcademicYear(data) {
    // Validate business rules
    validateAcademicYearDates(data.start_date, data.end_date);

    // Check duplicate name
    await ensureAcademicYearDoesNotExist(data.name);

    // create academic year
    const id = await academicYearRepository.create(data);

    // Return created record
    return await academicYearRepository.findById(id);
}


export async function getAcademicYears() {
    return await academicYearRepository.findAll();
}


export async function getAcademicYearById(id) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    return academicYear;
}


export async function updateAcademicYear(id, data) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND)
    }

    if (academicYear.status === "CLOSED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_EDIT_CLOSED)
    }

    validateAcademicYearDates(data.start_date, data.end_date);

    await academicYearRepository.update(id, data);

    return academicYearRepository.findById(id);
}


export async function activateAcademicYear(id) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND)
    }

    if (academicYear.status === "CLOSED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_EDIT_CLOSED)
    }
    
    if (academicYear.status === 'ACTIVE') return academicYear;

    await academicYearRepository.activate(id);

    return academicYearRepository.findById(id);
    // Later activate() will use transations to make sure only one academic year is active.
}


export async function closeAcademicYear(id) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND)
    }

    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_CLOSE_DRAFT);
    }

    await academicYearRepository.close(id);

    return academicYearRepository.findById(id);
}