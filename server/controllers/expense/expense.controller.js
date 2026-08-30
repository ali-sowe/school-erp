import * as expenseService from "../../services/expense/expense.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXPENSE_MESSAGES } from "../../constants/messages/expense/expense.message.js";

export const submitExpense = asyncHandler(
    async (req, res) => {
        const expense = await expenseService.submitExpense(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: EXPENSE_MESSAGES.SUBMITTED,
            data: expense
        });
    }
);

export const getExpenses = asyncHandler(
    async (req, res) => {
        const expenses = await expenseService.getExpenses(req.user.schoolId, {
            categoryId: req.query.category_id,
            academicYearId: req.query.academic_year_id,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_MESSAGES.FETCHED_ALL,
            data: expenses
        });
    }
);

export const getExpenseById = asyncHandler(
    async (req, res) => {
        const expense = await expenseService.getExpenseById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_MESSAGES.FETCHED,
            data: expense
        });
    }
);

export const getExpenseSummary = asyncHandler(
    async (req, res) => {
        const summary = await expenseService.getExpenseSummary(req.user.schoolId, req.query.academic_year_id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXPENSE_MESSAGES.SUMMARY_FETCHED,
            data: summary
        });
    }
);
