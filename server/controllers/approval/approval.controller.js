import * as approvalService from "../../services/approval/approval.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { APPROVAL_MESSAGES } from "../../constants/messages/approval/approval.message.js";

export const createApprovalRequest = asyncHandler(async (req, res) => {
    const request = await approvalService.createApprovalRequest(req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: APPROVAL_MESSAGES.CREATED,
        data: request
    });
});

export const getApprovalRequests = asyncHandler(async (req, res) => {
    const requests = await approvalService.getApprovalRequests(req.user.schoolId, {
        status: req.query.status,
        workflowType: req.query.workflow_type,
        entityType: req.query.entity_type,
        entityId: req.query.entity_id
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.FETCHED_ALL,
        data: requests
    });
});

export const getMyPendingApprovals = asyncHandler(async (req, res) => {
    const requests = await approvalService.getMyPendingApprovals(req.user.schoolId, req.user.userId, req.user.role);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.PENDING_FETCHED,
        data: requests
    });
});

export const getApprovalRequestById = asyncHandler(async (req, res) => {
    const request = await approvalService.getApprovalRequestById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.FETCHED,
        data: request
    });
});

export const approveCurrentStep = asyncHandler(async (req, res) => {
    const request = await approvalService.approveCurrentStep(
        req.params.id,
        req.user.schoolId,
        req.user.userId,
        req.user.role,
        req.body.comment
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.APPROVED,
        data: request
    });
});

export const rejectCurrentStep = asyncHandler(async (req, res) => {
    const request = await approvalService.rejectCurrentStep(
        req.params.id,
        req.user.schoolId,
        req.user.userId,
        req.user.role,
        req.body.comment
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.REJECTED,
        data: request
    });
});

export const executeApprovalRequest = asyncHandler(async (req, res) => {
    const request = await approvalService.executeApprovalRequest(
        req.params.id,
        req.user.schoolId,
        req.user.userId,
        req.body.note
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.EXECUTED,
        data: request
    });
});

export const cancelApprovalRequest = asyncHandler(async (req, res) => {
    const request = await approvalService.cancelApprovalRequest(
        req.params.id,
        req.user.schoolId,
        req.user.userId,
        req.body.reason
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: APPROVAL_MESSAGES.CANCELLED,
        data: request
    });
});
