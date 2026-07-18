import Joi from 'joi';

// Field names match the rest of the API (snake_case) — see repository/service
// layers and server/rest/request.rest for the actual request shape.
export const createAcademicYearSchema = Joi.object({
    name: Joi.string().trim().max(20).required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().greater(Joi.ref('start_date')).required()
});

export const updateAcademicYearSchema = Joi.object({
    name: Joi.string().trim().max(20),
    start_date: Joi.date(),
    end_date: Joi.date().greater(Joi.ref('start_date'))
}).min(1);