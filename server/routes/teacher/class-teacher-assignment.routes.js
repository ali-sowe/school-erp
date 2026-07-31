import { Router } from 'express';
import * as classTeacherController from '../../controllers/teacher/class-teacher.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

// Ending one already-recorded class teacher assignment by its own id.
// Assigning/reassigning is always scoped to one class, so it lives at
// PUT /api/classes/:id/class-teacher (class.routes.js).
router.patch('/:assignmentId/end', authenticate, authorize(['teacher-assignments.write']), asyncHandler(classTeacherController.endClassTeacherAssignment));

export default router;
