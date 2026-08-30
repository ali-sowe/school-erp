import Joi from 'joi';

export const recordPaymentSchema = Joi.object({
    amount: Joi.number().positive().required(),
    payment_method: Joi.string().trim().max(30).required(),
    payment_date: Joi.date().required(),
    reference_number: Joi.string().trim().max(100)
});

export const voidPaymentSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(255).required()
});
