import { Router } from 'express';
import * as copyController from '../../controllers/library/copy.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { withdrawCopySchema } from '../../validations/library/copy.validation.js';

const router = Router();

router.patch('/:copyId/withdraw', authenticate, authorize(['library.write']), validate(withdrawCopySchema), asyncHandler(copyController.withdrawCopy));
router.patch('/:copyId/restore', authenticate, authorize(['library.write']), asyncHandler(copyController.restoreCopy));

export default router;
