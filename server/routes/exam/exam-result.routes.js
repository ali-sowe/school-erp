import { Router } from 'express';
import * as examResultController from '../../controllers/exam/exam-result.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { updateExamResultSchema } from '../../validations/exam/exam-result.validation.js';

const router = Router();

// Correcting a single already-recorded result. Bulk recording lives under
// /api/exams/:id/results (exam.routes.js) — this endpoint is only for
// fixing one row after the fact, mirroring attendance.routes.js exactly.
router.patch('/:id', authenticate, authorize(['exams.write']), validate(updateExamResultSchema), asyncHandler(examResultController.updateExamResult));

export default router;
