import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpstatus.js';

export const authorize = (requiredPermissions = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required.'));
        }

        const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
        const hasAccess = requiredPermissions.every((permission) => userPermissions.includes(permission));

        if (!hasAccess) {
            return next(new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to access this resource.'));
        }

        next();
    };
};
