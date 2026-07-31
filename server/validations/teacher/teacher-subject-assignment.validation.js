import Joi from 'joi';

export const assignTeacherSchema = Joi.object({
    teacher_id: Joi.number().integer().positive().required(),
    subject_id: Joi.number().integer().positive().required(),
    academic_year_id: Joi.number().integer().positive()
});
