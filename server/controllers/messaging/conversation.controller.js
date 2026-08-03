import * as conversationService from "../../services/messaging/conversation.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CONVERSATION_MESSAGES } from "../../constants/messages/messaging/conversation.message.js";

export const createConversation = asyncHandler(
    async (req, res) => {
        const conversation = await conversationService.createConversation(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CONVERSATION_MESSAGES.CREATED,
            data: conversation
        });
    }
);

export const getConversations = asyncHandler(
    async (req, res) => {
        const conversations = await conversationService.getConversationsForUser(req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.FETCHED_ALL,
            data: conversations
        });
    }
);

export const getConversationById = asyncHandler(
    async (req, res) => {
        const conversation = await conversationService.getConversationById(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.FETCHED,
            data: conversation
        });
    }
);

export const getParticipants = asyncHandler(
    async (req, res) => {
        const participants = await conversationService.getConversationParticipants(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.PARTICIPANTS_FETCHED,
            data: participants
        });
    }
);

export const getMessages = asyncHandler(
    async (req, res) => {
        const messages = await conversationService.getMessages(
            req.params.id,
            req.user.schoolId,
            req.user.userId,
            { limit: req.query.limit ? Number(req.query.limit) : undefined, beforeId: req.query.before_id ? Number(req.query.before_id) : undefined }
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.MESSAGES_FETCHED,
            data: messages
        });
    }
);

export const sendMessage = asyncHandler(
    async (req, res) => {
        const message = await conversationService.sendMessage(req.params.id, req.user.schoolId, req.user.userId, req.body.body);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CONVERSATION_MESSAGES.MESSAGE_SENT,
            data: message
        });
    }
);

export const deleteMessage = asyncHandler(
    async (req, res) => {
        const result = await conversationService.deleteMessage(req.params.messageId, req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.MESSAGE_DELETED,
            data: result
        });
    }
);

export const markAsRead = asyncHandler(
    async (req, res) => {
        await conversationService.markConversationAsRead(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CONVERSATION_MESSAGES.MARKED_AS_READ,
            data: null
        });
    }
);
