import * as expenseCategoryService from "../../services/expense/expense-category.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXPENSE_CATEGORY_MESSAGES } from "../../constants/messages/expense/expense-category.message.js";

export const createExpenseCategory = asyncHandler(
    async (req, res) => {
        const category = await expenseCategoryService.createExpenseCategory(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.CREATED,
            data: category
        });
    }
);

export const getExpenseCategories = asyncHandler(
    async (req, res) => {
        const categories = await expenseCategoryService.getExpenseCategories(req.user.schoolId, req.query.status);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.FETCHED_ALL,
            data: categories
        });
    }
);

export const getExpenseCategoryById = asyncHandler(
    async (req, res) => {
        const category = await expenseCategoryService.getExpenseCategoryById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.FETCHED,
            data: category
        });
    }
);

export const updateExpenseCategory = asyncHandler(
    async (req, res) => {
        const category = await expenseCategoryService.updateExpenseCategory(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.UPDATED,
            data: category
        });
    }
);

export const archiveExpenseCategory = asyncHandler(
    async (req, res) => {
        const category = await expenseCategoryService.archiveExpenseCategory(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.ARCHIVED,
            data: category
        });
    }
);

export const restoreExpenseCategory = asyncHandler(
    async (req, res) => {
        const category = await expenseCategoryService.restoreExpenseCategory(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_CATEGORY_MESSAGES.RESTORED,
            data: category
        });
    }
);
