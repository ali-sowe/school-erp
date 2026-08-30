import Joi from 'joi';

export const submitExpenseSchema = Joi.object({
    category_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive().required(),
    title: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().max(1000),
    amount: Joi.number().positive().precision(2).required(),
    expense_date: Joi.date().iso().required(),
    vendor_name: Joi.string().trim().max(150),
    payment_method: Joi.string().trim().max(30),
    reference_number: Joi.string().trim().max(100)
});
