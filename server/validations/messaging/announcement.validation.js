import Joi from 'joi';

export const createAnnouncementSchema = Joi.object({
    title: Joi.string().trim().max(150).required(),
    body: Joi.string().trim().min(1).max(5000).required(),
    audience_type: Joi.string().valid('SCHOOL', 'GRADE_LEVEL', 'CLASS').required(),
    audience_id: Joi.number().integer().positive()
});

export const updateAnnouncementSchema = Joi.object({
    title: Joi.string().trim().max(150),
    body: Joi.string().trim().min(1).max(5000)
}).min(1);
