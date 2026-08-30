import * as leaveRequestService from '../../services/leave/leave-request.service.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { LEAVE_REQUEST_MESSAGES } from '../../constants/messages/leave/leave-request.message.js';

export const requestLeave = async (req, res) => {
    const leaveRequest = await leaveRequestService.requestLeave(req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: LEAVE_REQUEST_MESSAGES.SUBMITTED,
        data: leaveRequest
    });
};

export const getLeaveRequests = async (req, res) => {
    const leaveRequests = await leaveRequestService.getLeaveRequests(req.user.schoolId, {
        userId: req.query.user_id,
        status: req.query.status,
        leaveType: req.query.leave_type
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: LEAVE_REQUEST_MESSAGES.FETCHED_ALL,
        data: leaveRequests
    });
};

export const getMyLeaveRequests = async (req, res) => {
    const leaveRequests = await leaveRequestService.getMyLeaveRequests(req.user.schoolId, req.user.userId, {
        status: req.query.status,
        leaveType: req.query.leave_type
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: LEAVE_REQUEST_MESSAGES.FETCHED_ALL,
        data: leaveRequests
    });
};

export const getLeaveRequestById = async (req, res) => {
    const leaveRequest = await leaveRequestService.getLeaveRequestById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: LEAVE_REQUEST_MESSAGES.FETCHED,
        data: leaveRequest
    });
};
