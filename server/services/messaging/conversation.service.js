import {
    findOwnedConversationOrThrow,
    ensureActiveParticipantOrThrow,
    findOwnedParticipantUsersOrThrow
} from "../../helpers/messaging/conversation.helper.js";
import * as conversationRepository from "../../repositories/messaging/conversation.repository.js";
import * as participantRepository from "../../repositories/messaging/conversation-participant.repository.js";
import * as messageRepository from "../../repositories/messaging/message.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { CONVERSATION_MESSAGES } from "../../constants/messages/messaging/conversation.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { emitToUsers } from "../../helpers/realtime/realtime.helper.js";
import { notifyUsers } from "../../services/notification/notification.service.js";

export async function createConversation(data, schoolId, userId) {
    const otherParticipantIds = [...new Set((data.participant_ids ?? []).map(Number))].filter((id) => id !== userId);

    if (otherParticipantIds.length === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CONVERSATION_MESSAGES.PARTICIPANTS_REQUIRED);
    }

    const type = otherParticipantIds.length === 1 ? 'DIRECT' : 'GROUP';

    if (type === 'GROUP' && !data.title) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CONVERSATION_MESSAGES.GROUP_REQUIRES_TITLE);
    }

    await findOwnedParticipantUsersOrThrow(otherParticipantIds, schoolId);

    // Reuse an existing DIRECT thread rather than fragmenting history across
    // duplicate conversations between the same two people.
    if (type === 'DIRECT') {
        const existing = await conversationRepository.findDirectConversationBetween(schoolId, userId, otherParticipantIds[0]);
        if (existing) {
            return existing;
        }
    }

    const conversationId = await conversationRepository.create(
        { school_id: schoolId, type, title: type === 'GROUP' ? data.title : null },
        userId
    );

    await participantRepository.addParticipant(conversationId, userId);
    for (const participantId of otherParticipantIds) {
        await participantRepository.addParticipant(conversationId, participantId);
    }

    return await conversationRepository.findById(conversationId);
}

export async function getConversationsForUser(schoolId, userId) {
    return await conversationRepository.findAllForUser(schoolId, userId);
}

export async function getConversationById(id, schoolId, userId) {
    const conversation = await findOwnedConversationOrThrow(id, schoolId);
    await ensureActiveParticipantOrThrow(id, userId);

    return conversation;
}

// Only reachable by an active participant — same access rule as the
// conversation and its messages, since who's in a private conversation is
// itself information that shouldn't leak to non-participants.
export async function getConversationParticipants(id, schoolId, userId) {
    await findOwnedConversationOrThrow(id, schoolId);
    await ensureActiveParticipantOrThrow(id, userId);

    return await participantRepository.findActiveParticipantsWithUsers(id);
}

export async function getMessages(conversationId, schoolId, userId, pagination) {
    await findOwnedConversationOrThrow(conversationId, schoolId);
    await ensureActiveParticipantOrThrow(conversationId, userId);

    return await messageRepository.findForConversation(conversationId, pagination);
}

export async function sendMessage(conversationId, schoolId, senderId, body) {
    await findOwnedConversationOrThrow(conversationId, schoolId);
    await ensureActiveParticipantOrThrow(conversationId, senderId);

    const messageId = await messageRepository.create(conversationId, senderId, body);
    await conversationRepository.touchUpdatedAt(conversationId);

    const message = await messageRepository.findById(messageId);

    // Push to every other active participant; the sender already has the
    // message from the REST response, so there's no need to echo it back.
    const participants = await participantRepository.findActiveParticipants(conversationId);
    const recipientIds = participants
        .map((participant) => participant.user_id)
        .filter((id) => id !== senderId);

    emitToUsers(recipientIds, 'message:new', message);

    await notifyUsers(recipientIds, {
        schoolId,
        type: 'MESSAGE',
        title: 'New message',
        body: message.body.slice(0, 500),
        relatedEntityType: 'Conversation',
        relatedEntityId: Number(conversationId),
        triggeredBy: senderId
    });

    return message;
}

export async function deleteMessage(messageId, conversationId, schoolId, userId) {
    await findOwnedConversationOrThrow(conversationId, schoolId);
    await ensureActiveParticipantOrThrow(conversationId, userId);

    const message = await messageRepository.findById(messageId);

    if (!message || message.conversation_id !== Number(conversationId)) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CONVERSATION_MESSAGES.MESSAGE_NOT_FOUND);
    }

    if (message.sender_id !== userId) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, CONVERSATION_MESSAGES.MESSAGE_NOT_OWNED);
    }

    await messageRepository.softDelete(messageId);

    const participants = await participantRepository.findActiveParticipants(conversationId);
    const recipientIds = participants
        .map((participant) => participant.user_id)
        .filter((id) => id !== userId);

    emitToUsers(recipientIds, 'message:deleted', { id: messageId, conversation_id: Number(conversationId) });

    return { id: messageId };
}

export async function markConversationAsRead(conversationId, schoolId, userId) {
    await findOwnedConversationOrThrow(conversationId, schoolId);
    await ensureActiveParticipantOrThrow(conversationId, userId);

    await participantRepository.markAsRead(conversationId, userId);
}
