import { Router } from 'express';
import * as borrowController from '../../controllers/library/borrow.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { returnBookSchema } from '../../validations/library/borrow.validation.js';

const router = Router();

router.get('/', authenticate, authorize(['library.read']), asyncHandler(borrowController.getBorrowRecords));
router.get('/:id', authenticate, authorize(['library.read']), asyncHandler(borrowController.getBorrowRecordById));
router.patch('/:id/return', authenticate, authorize(['library.write']), validate(returnBookSchema), asyncHandler(borrowController.returnBook));

export default router;
