import * as guardianPortalAccountService from "../../services/student/guardian-portal-account.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GUARDIAN_MESSAGES } from "../../constants/messages/student/guardian.message.js";

// POST /api/guardians/:id/portal-account
export const createGuardianPortalAccount = asyncHandler(
    async (req, res) => {
        const guardian = await guardianPortalAccountService.createGuardianPortalAccount(
            req.params.id,
            req.body,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: GUARDIAN_MESSAGES.PORTAL_ACCOUNT_CREATED,
            data: guardian
        });
    }
);
