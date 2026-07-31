import { Router } from 'express';
import * as feeStructureController from '../../controllers/finance/fee-structure.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createFeeStructureSchema, updateFeeStructureSchema } from '../../validations/finance/fee-structure.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['finance.write']), validate(createFeeStructureSchema), asyncHandler(feeStructureController.createFeeStructure));
router.get('/', authenticate, authorize(['finance.read']), asyncHandler(feeStructureController.getFeeStructures));
router.get('/:id', authenticate, authorize(['finance.read']), asyncHandler(feeStructureController.getFeeStructureById));
router.patch('/:id', authenticate, authorize(['finance.write']), validate(updateFeeStructureSchema), asyncHandler(feeStructureController.updateFeeStructure));
router.patch('/:id/archive', authenticate, authorize(['finance.write']), asyncHandler(feeStructureController.archiveFeeStructure));
router.patch('/:id/restore', authenticate, authorize(['finance.write']), asyncHandler(feeStructureController.restoreFeeStructure));

export default router;
