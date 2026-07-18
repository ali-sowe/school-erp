import { Router } from 'express';
import * as schoolController from '../../controllers/school/school.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createSchoolSchema, updateSchoolSchema } from '../../validations/school/school.validation.js';

const router = Router();

// Deliberately restricted to the Platform Administrator for now — school
// onboarding is provisioned by the platform, not self-serve yet. A school's
// own Administrator does not have "schools.read"/"schools.write", so this
// resource stays platform-only until there's a scoped "my school" endpoint.
router.post('/', authenticate, authorize(['schools.write']), validate(createSchoolSchema), asyncHandler(schoolController.createSchool));
router.get('/', authenticate, authorize(['schools.read']), asyncHandler(schoolController.getSchools));
router.get('/:id', authenticate, authorize(['schools.read']), asyncHandler(schoolController.getSchoolById));
router.patch('/:id', authenticate, authorize(['schools.write']), validate(updateSchoolSchema), asyncHandler(schoolController.updateSchool));
router.patch('/:id/suspend', authenticate, authorize(['schools.write']), asyncHandler(schoolController.suspendSchool));
router.patch('/:id/reactivate', authenticate, authorize(['schools.write']), asyncHandler(schoolController.reactivateSchool));

export default router;
