import Joi from 'joi';

export const createFeeStructureSchema = Joi.object({
    academic_year_id: Joi.number().integer().positive().required(),
    grade_level_id: Joi.number().integer().positive(),
    name: Joi.string().trim().max(150).required(),
    amount: Joi.number().positive().required()
});

export const updateFeeStructureSchema = Joi.object({
    name: Joi.string().trim().max(150),
    amount: Joi.number().positive()
}).min(1);
