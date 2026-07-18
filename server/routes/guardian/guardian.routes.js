import { Router } from 'express';
import * as guardianController from '../../controllers/student/guardian.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createGuardianSchema, updateGuardianSchema } from '../../validations/student/guardian.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['guardians.write']), validate(createGuardianSchema), asyncHandler(guardianController.createGuardian));
router.get('/', authenticate, authorize(['guardians.read']), asyncHandler(guardianController.getGuardians));
router.get('/:id', authenticate, authorize(['guardians.read']), asyncHandler(guardianController.getGuardianById));
router.patch('/:id', authenticate, authorize(['guardians.write']), validate(updateGuardianSchema), asyncHandler(guardianController.updateGuardian));
router.patch('/:id/archive', authenticate, authorize(['guardians.write']), asyncHandler(guardianController.archiveGuardian));
router.patch('/:id/restore', authenticate, authorize(['guardians.write']), asyncHandler(guardianController.restoreGuardian));

// Reverse lookup: all students this guardian is responsible for.
router.get('/:id/students', authenticate, authorize(['guardians.read']), asyncHandler(guardianController.getStudentsForGuardian));

export default router;
