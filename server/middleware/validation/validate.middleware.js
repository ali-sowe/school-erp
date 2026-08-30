import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { SYSTEM_MESSAGES } from '../../constants/messages/system.message.js';

// Wraps a Joi schema as Express middleware. Keeps validation out of
// controllers, per the architecture doc (controllers validate request
// *shape* only, not business rules).
export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return next(new AppError(HTTP_STATUS.BAD_REQUEST, SYSTEM_MESSAGES.VALIDATION_ERROR, errors));
    }

    req.body = value;
    next();
};
