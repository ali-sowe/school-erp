import { Router } from 'express';
import * as leaveRequestController from '../../controllers/leave/leave-request.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createLeaveRequestSchema } from '../../validations/leave/leave-request.validation.js';

const router = Router();

// Placed before '/:id' — same reasoning as approval.routes.js's
// '/my-pending'.
router.get('/my', authenticate, authorize(['leave-requests.read']), asyncHandler(leaveRequestController.getMyLeaveRequests));

router.post('/', authenticate, authorize(['leave-requests.write']), validate(createLeaveRequestSchema), asyncHandler(leaveRequestController.requestLeave));
router.get('/', authenticate, authorize(['leave-requests.read']), asyncHandler(leaveRequestController.getLeaveRequests));
router.get('/:id', authenticate, authorize(['leave-requests.read']), asyncHandler(leaveRequestController.getLeaveRequestById));

// Approve / reject / cancel / execute deliberately are NOT duplicated here —
// use PATCH /api/approval-requests/:id/{approve,reject,cancel,execute}
// directly (see leave-request.service.js for why).

export default router;
