import { query } from "../../database/query.js";

export async function create(conversationId, senderId, body) {
    const result = await query(
        `INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)`,
        [conversationId, senderId, body]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM messages WHERE id = ?`, [id]);
    return rows[0] || null;
}

// Cursor-free pagination via beforeId: pass the oldest message id already
// loaded to fetch the next (older) page — simple and index-friendly for a
// chat history that only ever grows.
export async function findForConversation(conversationId, { limit = 50, beforeId } = {}) {
    if (beforeId) {
        return await query(
            `
            SELECT * FROM messages
            WHERE conversation_id = ? AND id < ?
            ORDER BY id DESC
            LIMIT ?
            `,
            [conversationId, String(beforeId), String(limit)]
        );
    }

    return await query(
        `SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?`,
        [conversationId, String(limit)]
    );
}

export async function softDelete(id) {
    await query(`UPDATE messages SET status = 'DELETED', body = '' WHERE id = ?`, [id]);
}
