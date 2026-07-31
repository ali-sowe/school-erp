import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { INVOICE_MESSAGES } from "../../constants/messages/finance/invoice.message.js";
import { AppError } from "../app-error.helper.js";
import * as invoiceRepository from "../../repositories/finance/invoice.repository.js";
import * as studentRepository from "../../repositories/student/student.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import * as termRepository from "../../repositories/term/term.repository.js";
import * as classRepository from "../../repositories/class/class.repository.js";

export function validateAmount(amount, message) {
    if (!(amount > 0)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, message);
    }
}

// Same tenant-ownership check used throughout the codebase.
export async function findOwnedInvoiceOrThrow(invoiceId, schoolId) {
    const invoice = await invoiceRepository.findById(invoiceId);

    if (!invoice || invoice.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, INVOICE_MESSAGES.NOT_FOUND);
    }

    return invoice;
}

export async function findOwnedStudentOrThrow(studentId, schoolId) {
    const student = await studentRepository.findById(studentId);

    if (!student || student.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, INVOICE_MESSAGES.STUDENT_NOT_FOUND);
    }

    return student;
}

export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, INVOICE_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}

export async function findOwnedTermOrThrow(termId, schoolId) {
    const term = await termRepository.findById(termId);

    if (!term || term.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, INVOICE_MESSAGES.TERM_NOT_FOUND);
    }

    return term;
}

export async function findOwnedClassOrThrow(classId, schoolId) {
    const classRow = await classRepository.findById(classId);

    if (!classRow || classRow.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, INVOICE_MESSAGES.CLASS_NOT_FOUND);
    }

    return classRow;
}
