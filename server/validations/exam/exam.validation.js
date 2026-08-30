import Joi from 'joi';

export const createExamSchema = Joi.object({
    class_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive(),
    term_id: Joi.number().integer().positive().required(),
    name: Joi.string().trim().max(150).required(),
    exam_type: Joi.string().trim().max(30),
    planned_start_date: Joi.date().required(),
    planned_end_date: Joi.date().required()
});

export const updateExamSchema = Joi.object({
    name: Joi.string().trim().max(150),
    exam_type: Joi.string().trim().max(30),
    planned_start_date: Joi.date(),
    planned_end_date: Joi.date()
}).min(1);

export const reopenExamSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(255).required()
});

export const addExamSubjectSchema = Joi.object({
    subject_id: Joi.number().integer().positive().required(),
    max_score: Joi.number().positive().default(100)
});
