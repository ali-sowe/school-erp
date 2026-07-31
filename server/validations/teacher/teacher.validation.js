import Joi from 'joi';

export const createTeacherSchema = Joi.object({
    first_name: Joi.string().trim().max(100).required(),
    last_name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required(),
    employee_number: Joi.string().trim().max(50),
    qualification: Joi.string().trim().max(150),
    specialization: Joi.string().trim().max(150),
    hire_date: Joi.date().iso()
});

export const updateTeacherSchema = Joi.object({
    qualification: Joi.string().trim().max(150),
    specialization: Joi.string().trim().max(150),
    hire_date: Joi.date().iso()
}).min(1);

// Same fields as createTeacherSchema minus password — a bulk-imported
// teacher never supplies one in a spreadsheet; see
// data-import/importers/teacher.importer.js for why a temporary one is
// generated instead.
export const importTeacherRowSchema = Joi.object({
    first_name: Joi.string().trim().max(100).required(),
    last_name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email().required(),
    employee_number: Joi.string().trim().max(50),
    qualification: Joi.string().trim().max(150),
    specialization: Joi.string().trim().max(150),
    hire_date: Joi.date().iso()
});
