import { ensureCategoryDoesNotExist } from "../../helpers/expense/expense-category.helper.js";
import * as expenseCategoryRepository from "../../repositories/expense/expense-category.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { EXPENSE_CATEGORY_MESSAGES } from "../../constants/messages/expense/expense-category.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createExpenseCategory(data, schoolId, userId = null) {
    await ensureCategoryDoesNotExist(schoolId, data.name);

    const id = await expenseCategoryRepository.create({ ...data, school_id: schoolId }, userId);

    return await expenseCategoryRepository.findById(id);
}

export async function getExpenseCategories(schoolId, status) {
    return await expenseCategoryRepository.findAll(schoolId, status);
}

// Every read of a specific category is tenant-checked here, so no caller
// can accidentally leak another school's record just by guessing an id.
async function findOwnedCategoryOrThrow(id, schoolId) {
    const category = await expenseCategoryRepository.findById(id);

    if (!category || category.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXPENSE_CATEGORY_MESSAGES.NOT_FOUND);
    }

    return category;
}

export async function getExpenseCategoryById(id, schoolId) {
    return await findOwnedCategoryOrThrow(id, schoolId);
}

export async function updateExpenseCategory(id, data, schoolId, userId = null) {
    const category = await findOwnedCategoryOrThrow(id, schoolId);

    if (category.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_CATEGORY_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (data.name && data.name !== category.name) {
        const existing = await expenseCategoryRepository.findByName(schoolId, data.name);
        if (existing && existing.id !== category.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, EXPENSE_CATEGORY_MESSAGES.DUPLICATE_NAME);
        }
    }

    await expenseCategoryRepository.update(id, data);

    const updatedCategory = await expenseCategoryRepository.findById(id);
    const changes = getChangedFields(category, updatedCategory);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "ExpenseCategory",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Expense category information updated",
            performedBy: userId
        });
    }

    return updatedCategory;
}

export async function archiveExpenseCategory(id, schoolId, userId = null) {
    const category = await findOwnedCategoryOrThrow(id, schoolId);

    if (category.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_CATEGORY_MESSAGES.ALREADY_ARCHIVED);
    }

    await expenseCategoryRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ExpenseCategory",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: category.status },
        newValues: { status: "ARCHIVED" },
        reason: "Expense category archived",
        performedBy: userId
    });

    return await expenseCategoryRepository.findById(id);
}

export async function restoreExpenseCategory(id, schoolId, userId = null) {
    const category = await findOwnedCategoryOrThrow(id, schoolId);

    if (category.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXPENSE_CATEGORY_MESSAGES.ALREADY_ACTIVE);
    }

    await expenseCategoryRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ExpenseCategory",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: category.status },
        newValues: { status: "ACTIVE" },
        reason: "Expense category restored",
        performedBy: userId
    });

    return await expenseCategoryRepository.findById(id);
}
