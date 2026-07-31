import Joi from 'joi';

export const borrowBookSchema = Joi.object({
    student_id: Joi.number().integer().positive().required(),
    copy_id: Joi.number().integer().positive(),
    borrowed_date: Joi.date().iso().default(() => new Date()),
    due_date: Joi.date().iso().required()
});

export const returnBookSchema = Joi.object({
    condition: Joi.string().valid('GOOD', 'DAMAGED', 'LOST'),
    returned_date: Joi.date().iso(),
    remarks: Joi.string().trim().max(255).allow('', null)
});
