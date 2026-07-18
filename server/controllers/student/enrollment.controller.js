import * as enrollmentService from "../../services/student/enrollment.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ENROLLMENT_MESSAGES } from "../../constants/messages/student/enrollment.message.js";

export const enrollStudent = asyncHandler(
    async (req, res) => {
        const enrollment = await enrollmentService.enrollStudent(
            req.params.id,
            req.body,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: ENROLLMENT_MESSAGES.CREATED,
            data: enrollment
        });
    }
);

export const getEnrollmentHistory = asyncHandler(
    async (req, res) => {
        const history = await enrollmentService.getEnrollmentHistory(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ENROLLMENT_MESSAGES.FETCHED_ALL,
            data: history
        });
    }
);

export const transferStudent = asyncHandler(
    async (req, res) => {
        const enrollment = await enrollmentService.transferStudent(
            req.params.enrollmentId,
            req.body.class_id,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ENROLLMENT_MESSAGES.TRANSFERRED,
            data: enrollment
        });
    }
);

export const withdrawStudent = asyncHandler(
    async (req, res) => {
        const enrollment = await enrollmentService.withdrawStudent(
            req.params.enrollmentId,
            req.body.reason,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ENROLLMENT_MESSAGES.WITHDRAWN,
            data: enrollment
        });
    }
);

export const completeEnrollment = asyncHandler(
    async (req, res) => {
        const enrollment = await enrollmentService.completeEnrollment(
            req.params.enrollmentId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ENROLLMENT_MESSAGES.COMPLETED,
            data: enrollment
        });
    }
);

// GET /api/classes/:id/roster?academic_year_id=&status=
export const getRoster = asyncHandler(
    async (req, res) => {
        const roster = await enrollmentService.getRoster(
            req.params.id,
            req.query.academic_year_id,
            req.user.schoolId,
            req.query.status
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ENROLLMENT_MESSAGES.FETCHED_ALL,
            data: roster
        });
    }
);
