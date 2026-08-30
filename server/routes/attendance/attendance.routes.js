import { Router } from 'express';
import * as attendanceController from '../../controllers/attendance/attendance.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { updateAttendanceSchema } from '../../validations/attendance/attendance.validation.js';

const router = Router();

// Correcting a single already-recorded entry. Marking a whole day's roster
// lives under /api/classes/:id/attendance (class.routes.js) since it's
// always scoped to one class — this endpoint is only for fixing one row
// after the fact.
router.patch('/:id', authenticate, authorize(['attendance.write']), validate(updateAttendanceSchema), asyncHandler(attendanceController.updateAttendanceRecord));

export default router;
