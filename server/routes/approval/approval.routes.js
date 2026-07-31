import { Router } from 'express';
import * as approvalController from '../../controllers/approval/approval.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import {
    createApprovalRequestSchema,
    decideApprovalStepSchema,
    rejectApprovalStepSchema,
    executeApprovalRequestSchema,
    cancelApprovalRequestSchema
} from '../../validations/approval/approval.validation.js';

const router = Router();

// Placed before /:id so 'my-pending' is never swallowed by the :id param
// route below (same reasoning as invoice.routes.js' /summary).
router.get('/my-pending', authenticate, authorize(['approvals.read']), asyncHandler(approvalController.getMyPendingApprovals));

router.post('/', authenticate, authorize(['approvals.write']), validate(createApprovalRequestSchema), asyncHandler(approvalController.createApprovalRequest));
router.get('/', authenticate, authorize(['approvals.read']), asyncHandler(approvalController.getApprovalRequests));
router.get('/:id', authenticate, authorize(['approvals.read']), asyncHandler(approvalController.getApprovalRequestById));

router.patch('/:id/approve', authenticate, authorize(['approvals.write']), validate(decideApprovalStepSchema), asyncHandler(approvalController.approveCurrentStep));
router.patch('/:id/reject', authenticate, authorize(['approvals.write']), validate(rejectApprovalStepSchema), asyncHandler(approvalController.rejectCurrentStep));
router.patch('/:id/execute', authenticate, authorize(['approvals.write']), validate(executeApprovalRequestSchema), asyncHandler(approvalController.executeApprovalRequest));
router.patch('/:id/cancel', authenticate, authorize(['approvals.write']), validate(cancelApprovalRequestSchema), asyncHandler(approvalController.cancelApprovalRequest));

export default router;
