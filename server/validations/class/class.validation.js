import Joi from 'joi';

export const createClassSchema = Joi.object({
    grade_level_id: Joi.number().integer().positive().required(),
    name: Joi.string().trim().max(50).required(),
    capacity: Joi.number().integer().positive()
});

export const updateClassSchema = Joi.object({
    name: Joi.string().trim().max(50),
    capacity: Joi.number().integer().positive()
}).min(1);

export const assignSubjectSchema = Joi.object({
    subject_id: Joi.number().integer().positive().required()
});
