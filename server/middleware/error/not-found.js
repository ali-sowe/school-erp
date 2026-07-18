import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { sendError } from "../../helpers/response.helper.js";

export const notFound = (req, res, next) => {
    return sendError(res, {
        status: HTTP_STATUS.NOT_FOUND,
        message: `Cannot ${req.method} ${req.originalUrl} - Not Found`,
    });
};