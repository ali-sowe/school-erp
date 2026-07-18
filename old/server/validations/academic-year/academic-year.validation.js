import Joi from 'joi';

export const createAcademicYearSchema = Joi.object({
    name: Joi.string().trim().max(20).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(joi.ref("start_date")).required()
})