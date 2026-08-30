import { Router } from 'express';
import * as expenseCategoryController from '../../controllers/expense/expense-category.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createExpenseCategorySchema, updateExpenseCategorySchema } from '../../validations/expense/expense-category.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['expenses.write']), validate(createExpenseCategorySchema), asyncHandler(expenseCategoryController.createExpenseCategory));
router.get('/', authenticate, authorize(['expenses.read']), asyncHandler(expenseCategoryController.getExpenseCategories));
router.get('/:id', authenticate, authorize(['expenses.read']), asyncHandler(expenseCategoryController.getExpenseCategoryById));
router.patch('/:id', authenticate, authorize(['expenses.write']), validate(updateExpenseCategorySchema), asyncHandler(expenseCategoryController.updateExpenseCategory));
router.patch('/:id/archive', authenticate, authorize(['expenses.write']), asyncHandler(expenseCategoryController.archiveExpenseCategory));
router.patch('/:id/restore', authenticate, authorize(['expenses.write']), asyncHandler(expenseCategoryController.restoreExpenseCategory));

export default router;
