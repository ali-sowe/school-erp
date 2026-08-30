import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXPENSE_CATEGORY_MESSAGES } from "../../constants/messages/expense/expense-category.message.js";
import { AppError } from "../app-error.helper.js";
import * as expenseCategoryRepository from "../../repositories/expense/expense-category.repository.js";

export async function ensureCategoryDoesNotExist(schoolId, name) {
    const existing = await expenseCategoryRepository.findByName(schoolId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, EXPENSE_CATEGORY_MESSAGES.DUPLICATE_NAME);
    }
}
