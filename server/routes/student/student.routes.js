import { Router } from 'express';
import * as studentController from '../../controllers/student/student.controller.js';
import * as guardianController from '../../controllers/student/guardian.controller.js';
import * as enrollmentController from '../../controllers/student/enrollment.controller.js';
import * as attendanceController from '../../controllers/attendance/attendance.controller.js';
import * as examResultController from '../../controllers/exam/exam-result.controller.js';
import * as borrowController from '../../controllers/library/borrow.controller.js';
import * as studentPortalAccountController from '../../controllers/student/student-portal-account.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createStudentSchema, updateStudentSchema, createStudentPortalAccountSchema } from '../../validations/student/student.validation.js';
import { linkGuardianSchema } from '../../validations/student/guardian.validation.js';
import { enrollStudentSchema, transferStudentSchema, requestTransferStudentSchema, withdrawStudentSchema } from '../../validations/student/enrollment.validation.js';

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
router.post('/:id/enrollments/:enrollmentId/transfer-request', authenticate, authorize(['students.write']), validate(requestTransferStudentSchema), asyncHandler(enrollmentController.requestTransferStudent));
router.patch('/:id/enrollments/:enrollmentId/withdraw', authenticate, authorize(['students.write']), validate(withdrawStudentSchema), asyncHandler(enrollmentController.withdrawStudent));
router.patch('/:id/enrollments/:enrollmentId/complete', authenticate, authorize(['students.write']), asyncHandler(enrollmentController.completeEnrollment));

// Attendance history: every day this student's attendance has been
// recorded, across whichever classes/years they were in at the time.
router.get('/:id/attendance', authenticate, authorize(['attendance.read']), asyncHandler(attendanceController.getStudentAttendanceHistory));

// Every exam result recorded for this student, across whichever exams and
// classes they've sat, filterable by academic year/term.
router.get('/:id/exam-results', authenticate, authorize(['exams.read']), asyncHandler(examResultController.getStudentResults));

// Library borrow history: every book this student has ever borrowed
// (returned or still out), across whichever copies they were issued.
router.get('/:id/borrowed-books', authenticate, authorize(['library.read']), asyncHandler(borrowController.getStudentBorrowHistory));

// Grants this student a Student Portal login — optional, requested after
// the profile already exists (see student-portal-account.service.js).
router.post('/:id/portal-account', authenticate, authorize(['students.write']), validate(createStudentPortalAccountSchema), asyncHandler(studentPortalAccountController.createStudentPortalAccount));

export default router;
