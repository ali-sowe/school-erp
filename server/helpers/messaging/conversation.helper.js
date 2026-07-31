import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CONVERSATION_MESSAGES } from "../../constants/messages/messaging/conversation.message.js";
import { AppError } from "../app-error.helper.js";
import * as conversationRepository from "../../repositories/messaging/conversation.repository.js";
import * as conversationParticipantRepository from "../../repositories/messaging/conversation-participant.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";

export async function findOwnedConversationOrThrow(conversationId, schoolId) {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation || conversation.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CONVERSATION_MESSAGES.NOT_FOUND);
    }

    return conversation;
}

// A conversation's existence is not enough to read/post in it — the
// requester must be one of its ACTIVE participants.
export async function ensureActiveParticipantOrThrow(conversationId, userId) {
    const participant = await conversationParticipantRepository.findParticipant(conversationId, userId);

    if (!participant || participant.status !== 'ACTIVE') {
        throw new AppError(HTTP_STATUS.FORBIDDEN, CONVERSATION_MESSAGES.NOT_A_PARTICIPANT);
    }

    return participant;
}

// Validates every proposed participant id exists and belongs to the same
// school — messaging is staff-only for now (see schema.js note), so this
// also doubles as the tenant-ownership check other modules do for their
// own related entities.
export async function findOwnedParticipantUsersOrThrow(userIds, schoolId) {
    const users = [];

    for (const userId of userIds) {
        const user = await userRepository.findById(userId);

        if (!user || user.school_id !== schoolId) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, CONVERSATION_MESSAGES.PARTICIPANT_USER_NOT_FOUND);
        }

        users.push(user);
    }

    return users;
}
