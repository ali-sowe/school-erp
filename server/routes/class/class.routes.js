import { Router } from 'express';
import * as classController from '../../controllers/class/class.controller.js';
import * as enrollmentController from '../../controllers/student/enrollment.controller.js';
import * as attendanceController from '../../controllers/attendance/attendance.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createClassSchema, updateClassSchema, assignSubjectSchema } from '../../validations/class/class.validation.js';
import { markAttendanceSchema } from '../../validations/attendance/attendance.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['classes.write']), validate(createClassSchema), asyncHandler(classController.createClass));
router.get('/', authenticate, authorize(['classes.read']), asyncHandler(classController.getClasses));
router.get('/:id', authenticate, authorize(['classes.read']), asyncHandler(classController.getClassById));
router.patch('/:id', authenticate, authorize(['classes.write']), validate(updateClassSchema), asyncHandler(classController.updateClass));
router.patch('/:id/archive', authenticate, authorize(['classes.write']), asyncHandler(classController.archiveClass));
router.patch('/:id/restore', authenticate, authorize(['classes.write']), asyncHandler(classController.restoreClass));

router.get('/:id/subjects', authenticate, authorize(['classes.read']), asyncHandler(classController.getClassSubjects));
router.post('/:id/subjects', authenticate, authorize(['classes.write']), validate(assignSubjectSchema), asyncHandler(classController.assignSubjectToClass));
router.delete('/:id/subjects/:subjectId', authenticate, authorize(['classes.write']), asyncHandler(classController.removeSubjectFromClass));

// Roster: which students are enrolled in this class for a given academic
// year (defaults to the active year). Lives in the Students/Enrollment
// module since roster history is owned there — see schema.js.
router.get('/:id/roster', authenticate, authorize(['classes.read']), asyncHandler(enrollmentController.getRoster));

// Attendance: marking a whole day's roster, and reading it back. Lives here
// (rather than a top-level /api/attendance) since both are always scoped to
// one class — correcting a single already-recorded entry is the one
// exception and lives at PATCH /api/attendance/:id (attendance.routes.js).
router.post('/:id/attendance', authenticate, authorize(['attendance.write']), validate(markAttendanceSchema), asyncHandler(attendanceController.markAttendance));
router.get('/:id/attendance', authenticate, authorize(['attendance.read']), asyncHandler(attendanceController.getClassAttendanceForDate));
router.get('/:id/attendance/summary', authenticate, authorize(['attendance.read']), asyncHandler(attendanceController.getClassAttendanceSummary));

export default router;
