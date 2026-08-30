import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard/dashboard.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

// Gated on students.read rather than left open to every authenticated user:
// Student/Parent portal accounts only ever hold portal.*.read (see
// permission.helper.js's comment on why), so this keeps them out of
// school-wide aggregates — pending approval titles, staff counts, etc. —
// they were never meant to see, the same way every other staff-facing
// module is gated. students.read is granted to both default staff roles
// (Administrator, Teacher), so this doesn't narrow who sees it in practice.
const router = Router();

router.get('/stats', authenticate, authorize(['students.read']), asyncHandler(dashboardController.getStats));
router.get('/activity', authenticate, authorize(['students.read']), asyncHandler(dashboardController.getRecentActivity));
router.get('/upcoming', authenticate, authorize(['students.read']), asyncHandler(dashboardController.getUpcomingEvents));

export default router;
