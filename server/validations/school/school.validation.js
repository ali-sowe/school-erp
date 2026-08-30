import Joi from 'joi';

const adminSchema = Joi.object({
    first_name: Joi.string().trim().max(100).required(),
    last_name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required()
});

export const createSchoolSchema = Joi.object({
    name: Joi.string().trim().max(150).required(),
    ownership_type: Joi.string().trim().max(50),
    region: Joi.string().trim().max(100),
    education_levels: Joi.array().items(Joi.string().trim()),
    admin: adminSchema.required()
});

export const updateSchoolSchema = Joi.object({
    name: Joi.string().trim().max(150),
    ownership_type: Joi.string().trim().max(50),
    region: Joi.string().trim().max(100),
    education_levels: Joi.array().items(Joi.string().trim())
}).min(1);
