import Joi from 'joi';

export const createImportBatchSchema = Joi.object({
    document_id: Joi.number().integer().positive().required(),
    target_type: Joi.string().trim().max(50).required(),
    context: Joi.object().unknown(true),
});
