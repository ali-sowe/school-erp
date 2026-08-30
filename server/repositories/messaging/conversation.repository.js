import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `INSERT INTO conversations (school_id, type, title, created_by) VALUES (?, ?, ?, ?)`,
        [data.school_id, data.type, data.title ?? null, createdBy]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM conversations WHERE id = ?`, [id]);
    return rows[0] || null;
}

// Every conversation a user participates in, ordered by most recently
// active first (so the inbox reads like a normal chat app).
export async function findAllForUser(schoolId, userId) {
    return await query(
        `
        SELECT conversations.*
        FROM conversations
        INNER JOIN conversation_participants ON conversation_participants.conversation_id = conversations.id
        WHERE conversations.school_id = ?
        AND conversation_participants.user_id = ?
        AND conversation_participants.status = 'ACTIVE'
        ORDER BY conversations.updated_at DESC
        `,
        [schoolId, userId]
    );
}

// Finds an existing DIRECT conversation between exactly these two users, so
// starting a "new" direct conversation with someone you already talk to
// reuses the same thread instead of fragmenting history.
export async function findDirectConversationBetween(schoolId, userIdA, userIdB) {
    const rows = await query(
        `
        SELECT conversations.*
        FROM conversations
        WHERE conversations.school_id = ?
        AND conversations.type = 'DIRECT'
        AND conversations.id IN (
            SELECT conversation_id FROM conversation_participants WHERE user_id = ?
        )
        AND conversations.id IN (
            SELECT conversation_id FROM conversation_participants WHERE user_id = ?
        )
        LIMIT 1
        `,
        [schoolId, userIdA, userIdB]
    );

    return rows[0] || null;
}

export async function touchUpdatedAt(id) {
    await query(`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
}
