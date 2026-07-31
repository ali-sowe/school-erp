import Joi from 'joi';

export const createLeaveRequestSchema = Joi.object({
    leave_type: Joi.string().trim().max(50),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required(),
    reason: Joi.string().trim().max(1000),
});
