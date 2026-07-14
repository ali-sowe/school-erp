import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { SYSTEM_MESSAGES } from "../../constants/messages/system.message.js";
import { sendError } from "../../helpers/response.helper.js";

export const errorHandler = (err, req, res, next) => {
    console.error(err); // Log the error for debugging

    return sendError(res, {
        status: err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: err.message || SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR,
        errors: err.errors || null,
    });
} 