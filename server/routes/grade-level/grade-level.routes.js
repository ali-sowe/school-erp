import { Router } from 'express';
import * as gradeLevelController from '../../controllers/grade-level/grade-level.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createGradeLevelSchema, updateGradeLevelSchema } from '../../validations/grade-level/grade-level.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['grade-levels.write']), validate(createGradeLevelSchema), asyncHandler(gradeLevelController.createGradeLevel));
router.get('/', authenticate, authorize(['grade-levels.read']), asyncHandler(gradeLevelController.getGradeLevels));
router.get('/:id', authenticate, authorize(['grade-levels.read']), asyncHandler(gradeLevelController.getGradeLevelById));
router.patch('/:id', authenticate, authorize(['grade-levels.write']), validate(updateGradeLevelSchema), asyncHandler(gradeLevelController.updateGradeLevel));
router.patch('/:id/archive', authenticate, authorize(['grade-levels.write']), asyncHandler(gradeLevelController.archiveGradeLevel));
router.patch('/:id/restore', authenticate, authorize(['grade-levels.write']), asyncHandler(gradeLevelController.restoreGradeLevel));

export default router;
