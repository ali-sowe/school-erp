import Joi from 'joi';

export const createConversationSchema = Joi.object({
    participant_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
    title: Joi.string().trim().max(150)
});

export const sendMessageSchema = Joi.object({
    body: Joi.string().trim().min(1).max(5000).required()
});
