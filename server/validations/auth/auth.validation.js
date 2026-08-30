import Joi from 'joi';

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().required()
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().trim().required(),
    new_password: Joi.string().min(8).required()
});

export const verifyMfaLoginSchema = Joi.object({
    challenge_token: Joi.string().trim().required(),
    // 6-digit TOTP or an XXXXX-XXXXX backup code — kept loose here (exact
    // format checked in mfa.service.js) so a valid backup code isn't
    // rejected before it even reaches the code that knows both formats.
    code: Joi.string().trim().required()
});

export const confirmMfaSchema = Joi.object({
    code: Joi.string().trim().length(6).pattern(/^\d+$/).required()
});

export const mfaPasswordConfirmSchema = Joi.object({
    password: Joi.string().required()
});
