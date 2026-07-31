import * as studentPortalAccountService from "../../services/student/student-portal-account.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { STUDENT_MESSAGES } from "../../constants/messages/student/student.message.js";

// POST /api/students/:id/portal-account
export const createStudentPortalAccount = asyncHandler(
    async (req, res) => {
        const student = await studentPortalAccountService.createStudentPortalAccount(
            req.params.id,
            req.body,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: STUDENT_MESSAGES.PORTAL_ACCOUNT_CREATED,
            data: student
        });
    }
);
