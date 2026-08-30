import { Router } from 'express';
import * as subjectController from '../../controllers/subject/subject.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createSubjectSchema, updateSubjectSchema } from '../../validations/subject/subject.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['subjects.write']), validate(createSubjectSchema), asyncHandler(subjectController.createSubject));
router.get('/', authenticate, authorize(['subjects.read']), asyncHandler(subjectController.getSubjects));
router.get('/:id', authenticate, authorize(['subjects.read']), asyncHandler(subjectController.getSubjectById));
router.patch('/:id', authenticate, authorize(['subjects.write']), validate(updateSubjectSchema), asyncHandler(subjectController.updateSubject));
router.patch('/:id/archive', authenticate, authorize(['subjects.write']), asyncHandler(subjectController.archiveSubject));
router.patch('/:id/restore', authenticate, authorize(['subjects.write']), asyncHandler(subjectController.restoreSubject));

export default router;
