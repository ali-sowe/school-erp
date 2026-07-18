import Joi from 'joi';

export const createStudentSchema = Joi.object({
    admission_number: Joi.string().trim().max(50),
    first_name: Joi.string().trim().max(100).required(),
    last_name: Joi.string().trim().max(100).required(),
    gender: Joi.string().trim().max(20),
    date_of_birth: Joi.date().iso().max('now'),
    admission_date: Joi.date().iso()
});

export const updateStudentSchema = Joi.object({
    first_name: Joi.string().trim().max(100),
    last_name: Joi.string().trim().max(100),
    gender: Joi.string().trim().max(20),
    date_of_birth: Joi.date().iso().max('now')
}).min(1);
