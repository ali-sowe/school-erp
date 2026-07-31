import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
    student_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive().required(),
    term_id: Joi.number().integer().positive(),
    fee_structure_id: Joi.number().integer().positive(),
    description: Joi.string().trim().max(255),
    amount_due: Joi.number().positive(),
    due_date: Joi.date()
});

export const bulkGenerateInvoicesSchema = Joi.object({
    fee_structure_id: Joi.number().integer().positive().required(),
    class_id: Joi.number().integer().positive().required()
});

export const voidInvoiceSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(255).required()
});
