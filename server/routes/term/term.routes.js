import { Router } from 'express';
import * as termController from '../../controllers/term/term.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createTermSchema, updateTermSchema } from '../../validations/term/term.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['terms.write']), validate(createTermSchema), asyncHandler(termController.createTerm));
router.get('/', authenticate, authorize(['terms.read']), asyncHandler(termController.getTerms));
router.get('/:id', authenticate, authorize(['terms.read']), asyncHandler(termController.getTermById));
router.patch('/:id', authenticate, authorize(['terms.write']), validate(updateTermSchema), asyncHandler(termController.updateTerm));
router.patch('/:id/activate', authenticate, authorize(['terms.write']), asyncHandler(termController.activateTerm));
router.patch('/:id/complete', authenticate, authorize(['terms.write']), asyncHandler(termController.completeTerm));

export default router;
