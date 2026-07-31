import { Router } from 'express';
import * as expenseController from '../../controllers/expense/expense.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { submitExpenseSchema } from '../../validations/expense/expense.validation.js';

const router = Router();

// Placed before '/:id' — same reasoning as approval.routes.js's
// '/my-pending' and leave-request.routes.js's '/my'.
router.get('/summary', authenticate, authorize(['expenses.read']), asyncHandler(expenseController.getExpenseSummary));

router.post('/', authenticate, authorize(['expenses.write']), validate(submitExpenseSchema), asyncHandler(expenseController.submitExpense));
router.get('/', authenticate, authorize(['expenses.read']), asyncHandler(expenseController.getExpenses));
router.get('/:id', authenticate, authorize(['expenses.read']), asyncHandler(expenseController.getExpenseById));

// Approve / reject / cancel / execute deliberately are NOT duplicated here —
// use PATCH /api/approval-requests/:id/{approve,reject,cancel,execute}
// directly (see expense.service.js for why).

export default router;
