import { Router } from 'express';
import * as conversationController from '../../controllers/messaging/conversation.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createConversationSchema, sendMessageSchema } from '../../validations/messaging/conversation.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['messaging.write']), validate(createConversationSchema), asyncHandler(conversationController.createConversation));
router.get('/', authenticate, authorize(['messaging.read']), asyncHandler(conversationController.getConversations));
router.get('/:id', authenticate, authorize(['messaging.read']), asyncHandler(conversationController.getConversationById));
router.get('/:id/participants', authenticate, authorize(['messaging.read']), asyncHandler(conversationController.getParticipants));

router.get('/:id/messages', authenticate, authorize(['messaging.read']), asyncHandler(conversationController.getMessages));
router.post('/:id/messages', authenticate, authorize(['messaging.write']), validate(sendMessageSchema), asyncHandler(conversationController.sendMessage));
router.delete('/:id/messages/:messageId', authenticate, authorize(['messaging.write']), asyncHandler(conversationController.deleteMessage));

router.patch('/:id/read', authenticate, authorize(['messaging.read']), asyncHandler(conversationController.markAsRead));

export default router;
