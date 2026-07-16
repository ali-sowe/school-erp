import { verifyToken } from '../../helpers/jwt.helper.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpstatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.AUTHENTICATION_REQUIRED));
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN));
    }
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN));
    }
};