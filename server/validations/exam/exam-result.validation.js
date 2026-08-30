import Joi from 'joi';

const examResultEntrySchema = Joi.object({
    student_id: Joi.number().integer().positive().required(),
    score: Joi.number().min(0).required(),
    remarks: Joi.string().trim().max(255).allow('', null)
});

export const recordResultsSchema = Joi.object({
    subject_id: Joi.number().integer().positive().required(),
    entries: Joi.array().items(examResultEntrySchema).min(1).required()
});

export const updateExamResultSchema = Joi.object({
    score: Joi.number().min(0),
    remarks: Joi.string().trim().max(255).allow('', null)
}).min(1);
