import { query } from "../../database/query.js";

export async function create(data) {
    const result = await query(
        `
        INSERT INTO notifications
        (
            school_id,
            user_id,
            type,
            title,
            body,
            related_entity_type,
            related_entity_id,
            triggered_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.user_id,
            data.type,
            data.title,
            data.body ?? null,
            data.related_entity_type ?? null,
            data.related_entity_id ?? null,
            data.triggered_by ?? null
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM notifications WHERE id = ?`, [id]);
    return rows[0] || null;
}

// isRead is an optional filter (true/false); omit it to get everything.
// beforeId is the oldest id already loaded, for simple "load more" paging,
// same shape as message.repository.js#findForConversation.
export async function findForUser(userId, { isRead, limit = 30, beforeId } = {}) {
    const conditions = ['user_id = ?'];
    const values = [userId];

    if (isRead !== undefined) {
        conditions.push('is_read = ?');
        values.push(isRead ? 1 : 0);
    }

    if (beforeId) {
        conditions.push('id < ?');
        values.push(beforeId);
    }

    values.push(limit);

    return await query(
        `
        SELECT * FROM notifications
        WHERE ${conditions.join(' AND ')}
        ORDER BY id DESC
        LIMIT ?
        `,
        values
    );
}

export async function countUnreadForUser(userId) {
    const rows = await query(
        `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0`,
        [userId]
    );

    return rows[0]?.total ?? 0;
}

export async function markAsRead(id) {
    await query(
        `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
    );
}

export async function markAllAsReadForUser(userId) {
    await query(
        `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0`,
        [userId]
    );
}
