import Joi from 'joi';

export const enrollStudentSchema = Joi.object({
    class_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive(),
    enrolled_date: Joi.date().iso()
});

export const transferStudentSchema = Joi.object({
    class_id: Joi.number().integer().positive().required()
});

export const requestTransferStudentSchema = Joi.object({
    class_id: Joi.number().integer().positive().required(),
    reason: Joi.string().trim().min(3).max(500).required()
});

export const withdrawStudentSchema = Joi.object({
    reason: Joi.string().trim().max(255)
});
