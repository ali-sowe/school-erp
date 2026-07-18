import Joi from 'joi';

// Field names match the rest of the API (snake_case).
export const createGradeLevelSchema = Joi.object({
    name: Joi.string().trim().max(50).required(),
    education_level: Joi.string().trim().max(50).required(),
    sequence_order: Joi.number().integer().min(0)
});

export const updateGradeLevelSchema = Joi.object({
    name: Joi.string().trim().max(50),
    education_level: Joi.string().trim().max(50),
    sequence_order: Joi.number().integer().min(0)
}).min(1);
