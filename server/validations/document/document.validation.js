import Joi from 'joi';

export const uploadDocumentSchema = Joi.object({
    title: Joi.string().trim().max(255).required(),
    category: Joi.string().trim().max(50),
    description: Joi.string().trim().max(1000),
    related_entity_type: Joi.string().trim().max(50),
    related_entity_id: Joi.number().integer().positive(),
}).and('related_entity_type', 'related_entity_id');

export const updateDocumentSchema = Joi.object({
    title: Joi.string().trim().max(255),
    category: Joi.string().trim().max(50),
    description: Joi.string().trim().max(1000),
}).min(1);
