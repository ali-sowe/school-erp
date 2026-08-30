import { verifyToken } from '../../helpers/jwt.helper.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import { normalizePermissions } from '../../helpers/auth/permission.helper.js';

export const authenticate = (req, res, next) => {
    // Prefer the httpOnly cookie (browser clients); fall back to a Bearer
    // header for non-browser clients such as request.rest or future mobile use.
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.AUTHENTICATION_REQUIRED));
        }

        const [scheme, headerToken] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !headerToken) {
            return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN));
        }

        token = headerToken;
    }

    try {
        const decoded = verifyToken(token);
        req.user = {
            ...decoded,
            permissions: normalizePermissions(decoded.permissions)
        };
        next();
    } catch (error) {
        return next(new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN));
    }
};