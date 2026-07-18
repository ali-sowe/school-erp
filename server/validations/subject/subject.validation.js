import Joi from 'joi';

export const createSubjectSchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    code: Joi.string().trim().uppercase().max(20).required(),
    is_core: Joi.boolean()
});

export const updateSubjectSchema = Joi.object({
    name: Joi.string().trim().max(100),
    code: Joi.string().trim().uppercase().max(20),
    is_core: Joi.boolean()
}).min(1);
