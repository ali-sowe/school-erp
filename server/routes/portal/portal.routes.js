import { Router } from 'express';
import * as studentPortalController from '../../controllers/portal/student-portal.controller.js';
import * as parentPortalController from '../../controllers/portal/parent-portal.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

// portal.student.read / portal.parent.read are only ever granted to the
// Student / Parent roles (see permission.helper.js) — deliberately not
// the same students.read/attendance.read/exams.read staff use, since those
// permission strings alone don't scope to "your own record only". Every
// handler behind these routes resolves identity from req.user.userId, never
// from a client-supplied id.
router.get('/student/me', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.getMyProfile));
router.get('/student/attendance', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.getMyAttendance));
router.get('/student/exam-results', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.getMyExamResults));
router.get('/student/library', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.getMyLibraryBorrows));
router.get('/student/announcements', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.getMyAnnouncements));
router.patch('/student/announcements/:announcementId/read', authenticate, authorize(['portal.student.read']), asyncHandler(studentPortalController.markAnnouncementRead));

router.get('/parent/children', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getMyChildren));
router.get('/parent/children/:studentId/attendance', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getChildAttendance));
router.get('/parent/children/:studentId/exam-results', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getChildExamResults));
router.get('/parent/children/:studentId/invoices', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getChildInvoices));
router.get('/parent/children/:studentId/library', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getChildLibraryBorrows));
router.get('/parent/children/:studentId/announcements', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.getChildAnnouncements));
router.patch('/parent/announcements/:announcementId/read', authenticate, authorize(['portal.parent.read']), asyncHandler(parentPortalController.markAnnouncementRead));

export default router;
