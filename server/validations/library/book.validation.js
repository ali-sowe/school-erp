import Joi from 'joi';

export const createBookSchema = Joi.object({
    title: Joi.string().trim().max(255).required(),
    author: Joi.string().trim().max(150),
    isbn: Joi.string().trim().max(20),
    category: Joi.string().trim().max(100),
    publisher: Joi.string().trim().max(150),
    description: Joi.string().trim().max(5000)
});

export const updateBookSchema = Joi.object({
    title: Joi.string().trim().max(255),
    author: Joi.string().trim().max(150),
    isbn: Joi.string().trim().max(20),
    category: Joi.string().trim().max(100),
    publisher: Joi.string().trim().max(150),
    description: Joi.string().trim().max(5000)
}).min(1);
