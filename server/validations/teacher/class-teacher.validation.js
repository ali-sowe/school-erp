import Joi from 'joi';

export const assignClassTeacherSchema = Joi.object({
    teacher_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive()
});
