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

export async function markAsRead(conversationId, userId) {
    await query(
        `UPDATE conversation_participants SET last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
    );
}
