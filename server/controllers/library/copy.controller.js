import * as copyService from "../../services/library/copy.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { COPY_MESSAGES } from "../../constants/messages/library/copy.message.js";

export const addCopies = async (req, res) => {
    const copies = await copyService.addCopies(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: COPY_MESSAGES.ADDED,
        data: copies
    });
};

export const getCopiesForBook = async (req, res) => {
    const copies = await copyService.getCopiesForBook(req.params.id, req.query.status, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: COPY_MESSAGES.FETCHED_ALL,
        data: copies
    });
};

export const withdrawCopy = async (req, res) => {
    const copy = await copyService.withdrawCopy(req.params.copyId, req.body.reason, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: COPY_MESSAGES.WITHDRAWN,
        data: copy
    });
};

export const restoreCopy = async (req, res) => {
    const copy = await copyService.restoreCopy(req.params.copyId, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: COPY_MESSAGES.RESTORED,
        data: copy
    });
};
