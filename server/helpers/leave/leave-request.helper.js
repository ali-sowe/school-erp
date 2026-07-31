import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { LEAVE_REQUEST_MESSAGES } from '../../constants/messages/leave/leave-request.message.js';
import { AppError } from '../app-error.helper.js';
import * as leaveRequestRepository from '../../repositories/leave/leave-request.repository.js';

// Same tenant-ownership pattern used throughout the codebase.
export async function findOwnedLeaveRequestOrThrow(id, schoolId) {
    const leaveRequest = await leaveRequestRepository.findById(id);

    if (!leaveRequest || leaveRequest.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, LEAVE_REQUEST_MESSAGES.NOT_FOUND);
    }

    return leaveRequest;
}

export function ensureValidDateRange(startDate, endDate) {
    if (new Date(endDate) < new Date(startDate)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, LEAVE_REQUEST_MESSAGES.INVALID_DATE_RANGE);
    }
}

export async function ensureNoOverlap(userId, startDate, endDate) {
    const overlapping = await leaveRequestRepository.findOverlapping(userId, startDate, endDate);

    if (overlapping.length > 0) {
        throw new AppError(HTTP_STATUS.CONFLICT, LEAVE_REQUEST_MESSAGES.OVERLAPPING_REQUEST);
    }
}
