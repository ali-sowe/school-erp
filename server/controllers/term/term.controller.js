import * as termService from "../../services/term/term.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TERM_MESSAGES } from "../../constants/messages/term/term.message.js";

export const createTerm = asyncHandler(
    async (req, res) => {
        const term = await termService.createTerm(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: TERM_MESSAGES.CREATED,
            data: term
        });
    }
);

export const getTerms = asyncHandler(
    async (req, res) => {
        const terms = await termService.getTerms(req.user.schoolId, req.query.academic_year_id || null);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TERM_MESSAGES.FETCHED_ALL,
            data: terms
        });
    }
);

export const getTermById = asyncHandler(
    async (req, res) => {
        const term = await termService.getTermById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TERM_MESSAGES.FETCHED,
            data: term
        });
    }
);

export const updateTerm = asyncHandler(
    async (req, res) => {
        const term = await termService.updateTerm(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TERM_MESSAGES.UPDATED,
            data: term
        });
    }
);

export const activateTerm = asyncHandler(
    async (req, res) => {
        const term = await termService.activateTerm(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TERM_MESSAGES.ACTIVATED,
            data: term
        });
    }
);

export const completeTerm = asyncHandler(
    async (req, res) => {
        const term = await termService.completeTerm(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TERM_MESSAGES.COMPLETED,
            data: term
        });
    }
);
