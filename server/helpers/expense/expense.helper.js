import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXPENSE_MESSAGES } from "../../constants/messages/expense/expense.message.js";
import { AppError } from "../app-error.helper.js";
import * as expenseRepository from "../../repositories/expense/expense.repository.js";
import * as expenseCategoryRepository from "../../repositories/expense/expense-category.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";

export function validateAmount(amount) {
    if (!(amount > 0)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_MESSAGES.INVALID_AMOUNT);
    }
}

// Same tenant-ownership pattern used throughout the codebase.
export async function findOwnedExpenseOrThrow(id, schoolId) {
    const expense = await expenseRepository.findById(id);

    if (!expense || expense.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXPENSE_MESSAGES.NOT_FOUND);
    }

    return expense;
}

// Verifies the category exists, belongs to this school, and is still
// ACTIVE — an archived category shouldn't accept new expenses, same
// "archived means read-only going forward" rule as elsewhere.
export async function findOwnedActiveCategoryOrThrow(categoryId, schoolId) {
    const category = await expenseCategoryRepository.findById(categoryId);

    if (!category || category.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXPENSE_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_MESSAGES.CATEGORY_ARCHIVED);
    }

    return category;
}

export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXPENSE_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}

// Stricter than findOwnedAcademicYearOrThrow: used only where an expense is
// actually being recorded, not for reads (getExpenseSummary still needs to
// work against a COMPLETED year for historical reporting). Blocks logging
// costs against a year that's already finished or hasn't started yet —
// same "no COMPLETED means read-only" boundary term.service.js enforces
// (TERM_MESSAGES.ACADEMIC_YEAR_NOT_ACTIVE / ACADEMIC_YEAR_COMPLETED), just
// stricter here since an expense is real money spent on a specific day,
// not a plannable record like a term.
export async function findOwnedActiveAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await findOwnedAcademicYearOrThrow(academicYearId, schoolId);

    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_MESSAGES.ACADEMIC_YEAR_NOT_ACTIVE);
    }

    return academicYear;
}
