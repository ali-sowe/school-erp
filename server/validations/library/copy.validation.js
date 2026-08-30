import Joi from 'joi';

// copy_numbers, when given, takes priority over quantity in the service —
// Joi only checks shape here, not the "which one wins" business rule.
export const addCopiesSchema = Joi.object({
    quantity: Joi.number().integer().min(1).max(500),
    copy_numbers: Joi.array().items(Joi.string().trim().max(50)).min(1)
});

export const withdrawCopySchema = Joi.object({
    reason: Joi.string().trim().max(255).required()
});
