import Joi from 'joi';

export const createTermSchema = Joi.object({
    academic_year_id: Joi.number().integer().positive().required(),
    name: Joi.string().trim().max(50).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required()
});

export const updateTermSchema = Joi.object({
    name: Joi.string().trim().max(50),
    start_date: Joi.date(),
    end_date: Joi.date().greater(Joi.ref('start_date'))
}).min(1);
