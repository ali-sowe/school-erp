import { Router } from 'express';
import * as studentController from '../../controllers/student/student.controller.js';
import * as guardianController from '../../controllers/student/guardian.controller.js';
import * as enrollmentController from '../../controllers/student/enrollment.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createStudentSchema, updateStudentSchema } from '../../validations/student/student.validation.js';
import { linkGuardianSchema } from '../../validations/student/guardian.validation.js';
import { enrollStudentSchema, transferStudentSchema, withdrawStudentSchema } from '../../validations/student/enrollment.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['students.write']), validate(createStudentSchema), asyncHandler(studentController.createStudent));
router.get('/', authenticate, authorize(['students.read']), asyncHandler(studentController.getStudents));
router.get('/:id', authenticate, authorize(['students.read']), asyncHandler(studentController.getStudentById));
router.patch('/:id', authenticate, authorize(['students.write']), validate(updateStudentSchema), asyncHandler(studentController.updateStudent));
router.patch('/:id/archive', authenticate, authorize(['students.write']), asyncHandler(studentController.archiveStudent));
router.patch('/:id/restore', authenticate, authorize(['students.write']), asyncHandler(studentController.restoreStudent));

// Guardian links
router.get('/:id/guardians', authenticate, authorize(['students.read']), asyncHandler(guardianController.getGuardiansForStudent));
router.post('/:id/guardians', authenticate, authorize(['students.write']), validate(linkGuardianSchema), asyncHandler(guardianController.linkGuardianToStudent));
router.delete('/:id/guardians/:guardianId', authenticate, authorize(['students.write']), asyncHandler(guardianController.unlinkGuardianFromStudent));

// Enrollment (roster/promotion history)
router.get('/:id/enrollments', authenticate, authorize(['students.read']), asyncHandler(enrollmentController.getEnrollmentHistory));
router.post('/:id/enrollments', authenticate, authorize(['students.write']), validate(enrollStudentSchema), asyncHandler(enrollmentController.enrollStudent));
router.patch('/:id/enrollments/:enrollmentId/transfer', authenticate, authorize(['students.write']), validate(transferStudentSchema), asyncHandler(enrollmentController.transferStudent));
router.patch('/:id/enrollments/:enrollmentId/withdraw', authenticate, authorize(['students.write']), validate(withdrawStudentSchema), asyncHandler(enrollmentController.withdrawStudent));
router.patch('/:id/enrollments/:enrollmentId/complete', authenticate, authorize(['students.write']), asyncHandler(enrollmentController.completeEnrollment));

export default router;
