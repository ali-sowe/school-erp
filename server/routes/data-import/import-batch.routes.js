import { Router } from 'express';
import * as importBatchController from '../../controllers/data-import/import-batch.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createImportBatchSchema } from '../../validations/data-import/import-batch.validation.js';

const router = Router();

// Registered before '/:id' for the same reason document.routes.js orders
// '/search' first — otherwise Express would match "target-types" as :id.
router.get('/target-types', authenticate, authorize(['data-imports.read']), asyncHandler(importBatchController.getTargetTypes));

router.post('/', authenticate, authorize(['data-imports.write']), validate(createImportBatchSchema), asyncHandler(importBatchController.createImportBatch));
router.get('/', authenticate, authorize(['data-imports.read']), asyncHandler(importBatchController.getImportBatches));
router.get('/:id', authenticate, authorize(['data-imports.read']), asyncHandler(importBatchController.getImportBatchById));
router.get('/:id/rows', authenticate, authorize(['data-imports.read']), asyncHandler(importBatchController.getImportBatchRows));
router.patch('/:id/confirm', authenticate, authorize(['data-imports.write']), asyncHandler(importBatchController.confirmImportBatch));
router.patch('/:id/cancel', authenticate, authorize(['data-imports.write']), asyncHandler(importBatchController.cancelImportBatch));

export default router;
