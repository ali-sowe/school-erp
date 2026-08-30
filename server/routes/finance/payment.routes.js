import { Router } from 'express';
import * as paymentController from '../../controllers/finance/payment.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { voidPaymentSchema } from '../../validations/finance/payment.validation.js';

const router = Router();

router.patch('/:paymentId/void', authenticate, authorize(['finance.write']), validate(voidPaymentSchema), asyncHandler(paymentController.voidPayment));
router.post('/:paymentId/void-request', authenticate, authorize(['finance.write']), validate(voidPaymentSchema), asyncHandler(paymentController.requestVoidPayment));

export default router;
