import { query } from "../../database/query.js";

export async function addParticipant(conversationId, userId) {
    const result = await query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)`,
        [conversationId, userId]
    );

    return result.insertId;
}

export async function findParticipant(conversationId, userId) {
    const rows = await query(
        `SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
    );

    return rows[0] || null;
}

export async function findActiveParticipants(conversationId) {
    return await query(
        `SELECT * FROM conversation_participants WHERE conversation_id = ? AND status = 'ACTIVE'`,
        [conversationId]
    );
}

// Same rows as findActiveParticipants, joined with the user's own name/email
// — conversations and messages both only ever store a bare user_id/sender_id
// (see conversation.repository.js, message.repository.js), so this is the
// one place client code can resolve "who is actually in this thread" and
// build its own id -> name map from, rather than the client needing to
// fetch the whole school's user list to do the same thing indirectly.
export async function findActiveParticipantsWithUsers(conversationId) {
    return await query(
        `
        SELECT
            conversation_participants.user_id,
            conversation_participants.last_read_at,
            users.first_name,
            users.last_name,
            users.email
        FROM conversation_participants
        INNER JOIN users ON users.id = conversation_participants.user_id
        WHERE conversation_participants.conversation_id = ?
        AND conversation_participants.status = 'ACTIVE'
        `,
        [conversationId]
    );
}

export async function markAsRead(conversationId, userId) {
    await query(
        `UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
    );
}
