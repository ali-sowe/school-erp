import Joi from 'joi';

const stepSchema = Joi.object({
    approver_user_id: Joi.number().integer().positive(),
    approver_role_name: Joi.string().trim().max(100)
}).xor('approver_user_id', 'approver_role_name');

export const createApprovalRequestSchema = Joi.object({
    workflow_type: Joi.string().trim().max(50).required(),
    entity_type: Joi.string().trim().max(100),
    entity_id: Joi.number().integer().positive(),
    title: Joi.string().trim().max(255).required(),
    description: Joi.string().trim().max(1000),
    metadata: Joi.object().unknown(true),
    steps: Joi.array().items(stepSchema).min(1).required()
});

export const decideApprovalStepSchema = Joi.object({
    comment: Joi.string().trim().max(500)
});

export const rejectApprovalStepSchema = Joi.object({
    comment: Joi.string().trim().min(3).max(500).required()
});

export const executeApprovalRequestSchema = Joi.object({
    note: Joi.string().trim().max(500)
});

export const cancelApprovalRequestSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(500).required()
});
