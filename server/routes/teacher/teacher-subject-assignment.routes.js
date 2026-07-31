import { Router } from 'express';
import * as teacherSubjectAssignmentController from '../../controllers/teacher/teacher-subject-assignment.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

// Ending one already-recorded assignment by its own id. Creating/reassigning
// is always scoped to one class, so it lives at
// POST /api/classes/:id/subject-teachers (class.routes.js) — same split as
// attendance.routes.js vs class.routes.js's /attendance endpoints.
router.patch('/:assignmentId/end', authenticate, authorize(['teacher-assignments.write']), asyncHandler(teacherSubjectAssignmentController.endAssignment));

export default router;
