import Joi from 'joi';

export const createGuardianSchema = Joi.object({
    first_name: Joi.string().trim().max(100).required(),
    last_name: Joi.string().trim().max(100).required(),
    phone: Joi.string().trim().max(30),
    email: Joi.string().trim().email().max(255),
    address: Joi.string().trim().max(255),
    occupation: Joi.string().trim().max(100)
});

export const updateGuardianSchema = Joi.object({
    first_name: Joi.string().trim().max(100),
    last_name: Joi.string().trim().max(100),
    phone: Joi.string().trim().max(30),
    email: Joi.string().trim().email().max(255),
    address: Joi.string().trim().max(255),
    occupation: Joi.string().trim().max(100)
}).min(1);

export const linkGuardianSchema = Joi.object({
    guardian_id: Joi.number().integer().positive().required(),
    relationship: Joi.string().trim().max(50).required(),
    is_primary_contact: Joi.boolean()
});

// email is optional here (unlike student's, which has no email on file at
// all) — the service falls back to the guardian's own email on record.
export const createGuardianPortalAccountSchema = Joi.object({
    email: Joi.string().trim().email(),
    password: Joi.string().min(8).required()
});
