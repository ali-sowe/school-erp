import { Router } from 'express';
import * as teacherController from '../../controllers/teacher/teacher.controller.js';
import * as teacherSubjectAssignmentController from '../../controllers/teacher/teacher-subject-assignment.controller.js';
import * as classTeacherController from '../../controllers/teacher/class-teacher.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createTeacherSchema, updateTeacherSchema } from '../../validations/teacher/teacher.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['teachers.write']), validate(createTeacherSchema), asyncHandler(teacherController.createTeacher));
router.get('/', authenticate, authorize(['teachers.read']), asyncHandler(teacherController.getTeachers));
router.get('/:id', authenticate, authorize(['teachers.read']), asyncHandler(teacherController.getTeacherById));
router.patch('/:id', authenticate, authorize(['teachers.write']), validate(updateTeacherSchema), asyncHandler(teacherController.updateTeacher));
router.patch('/:id/archive', authenticate, authorize(['teachers.write']), asyncHandler(teacherController.archiveTeacher));
router.patch('/:id/restore', authenticate, authorize(['teachers.write']), asyncHandler(teacherController.restoreTeacher));

// What this teacher teaches, and which classes they're the homeroom
// teacher for — a teacher's own "my classes" view is built from these two.
router.get('/:id/subject-assignments', authenticate, authorize(['teacher-assignments.read']), asyncHandler(teacherSubjectAssignmentController.getAssignmentsForTeacher));
router.get('/:id/class-teacher-assignments', authenticate, authorize(['teacher-assignments.read']), asyncHandler(classTeacherController.getClassesForTeacher));

export default router;
