import Joi from 'joi';

export const createExpenseCategorySchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().max(255)
});

export const updateExpenseCategorySchema = Joi.object({
    name: Joi.string().trim().max(100),
    description: Joi.string().trim().max(255)
}).min(1);
