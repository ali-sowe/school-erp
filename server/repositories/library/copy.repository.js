import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO book_copies (school_id, book_id, copy_number, created_by)
        VALUES (?, ?, ?, ?)
        `,
        [data.school_id, data.book_id, data.copy_number ?? null, createdBy]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM book_copies WHERE id = ?`, [id]);
    return rows[0] || null;
}

// Same as findById, but locks the row (FOR UPDATE) — only meaningful inside
// a transaction (see borrow.service.js#borrowBook), so a caller pinning a
// specific copy_id can't race the auto-pick path onto the same copy.
export async function findByIdForUpdate(id, connection) {
    const [rows] = await connection.query(`SELECT * FROM book_copies WHERE id = ? FOR UPDATE`, [id]);
    return rows[0] || null;
}

export async function findByCopyNumber(schoolId, copyNumber) {
    if (!copyNumber) {
        return null;
    }

    const rows = await query(`SELECT * FROM book_copies WHERE school_id = ? AND copy_number = ?`, [schoolId, copyNumber]);
    return rows[0] || null;
}

export async function findForBook(bookId, status) {
    if (status) {
        return await query(`SELECT * FROM book_copies WHERE book_id = ? AND status = ? ORDER BY id ASC`, [bookId, status]);
    }

    return await query(`SELECT * FROM book_copies WHERE book_id = ? ORDER BY id ASC`, [bookId]);
}

// The copy the borrow flow actually issues when the caller doesn't pin a
// specific copy_id — whichever AVAILABLE copy of this book comes first.
export async function findFirstAvailableForBook(bookId, connection = null) {
    const sql = `SELECT * FROM book_copies WHERE book_id = ? AND status = 'AVAILABLE' ORDER BY id ASC LIMIT 1 FOR UPDATE`;

    if (connection) {
        const [rows] = await connection.query(sql, [bookId]);
        return rows[0] || null;
    }

    const rows = await query(sql, [bookId]);
    return rows[0] || null;
}

export async function setStatus(id, status, reason = null, connection = null) {
    const sql = `UPDATE book_copies SET status = ?, reason = ? WHERE id = ?`;
    const params = [status, reason, id];

    if (connection) {
        await connection.query(sql, params);
        return;
    }

    await query(sql, params);
}
