import { query } from "../../database/query.js";

export async function create(data, connection = null) {
    const sql = `
        INSERT INTO borrow_records
        (
            school_id,
            book_copy_id,
            student_id,
            borrowed_date,
            due_date,
            issued_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.book_copy_id,
        data.student_id,
        data.borrowed_date,
        data.due_date,
        data.issued_by ?? null
    ];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM borrow_records WHERE id = ?`, [id]);
    return rows[0] || null;
}

// The current unreturned borrow record for a copy, if any — used both to
// resolve "return this copy" and to block issuing an already-borrowed copy.
export async function findActiveForCopy(bookCopyId) {
    const rows = await query(
        `SELECT * FROM borrow_records WHERE book_copy_id = ? AND status = 'BORROWED' LIMIT 1`,
        [bookCopyId]
    );
    return rows[0] || null;
}

// Blocks a student from double-borrowing the same title while an existing
// copy of it is still out to them.
export async function findActiveForStudentAndBook(studentId, bookId) {
    const rows = await query(
        `
        SELECT borrow_records.*
        FROM borrow_records
        INNER JOIN book_copies ON book_copies.id = borrow_records.book_copy_id
        WHERE borrow_records.student_id = ?
            AND book_copies.book_id = ?
            AND borrow_records.status = 'BORROWED'
        LIMIT 1
        `,
        [studentId, bookId]
    );
    return rows[0] || null;
}

// is_overdue is computed here (due_date < CURDATE() while still BORROWED)
// rather than stored, so it's always correct without a lifecycle job.
export async function findAll(schoolId, { studentId, bookId, status, overdueOnly } = {}) {
    const conditions = ['borrow_records.school_id = ?'];
    const values = [schoolId];

    if (studentId) {
        conditions.push('borrow_records.student_id = ?');
        values.push(studentId);
    }

    if (bookId) {
        conditions.push('book_copies.book_id = ?');
        values.push(bookId);
    }

    if (status) {
        conditions.push('borrow_records.status = ?');
        values.push(status);
    }

    if (overdueOnly) {
        conditions.push(`borrow_records.status = 'BORROWED' AND borrow_records.due_date < CURDATE()`);
    }

    return await query(
        `
        SELECT
            borrow_records.*,
            book_copies.book_id,
            (borrow_records.status = 'BORROWED' AND borrow_records.due_date < CURDATE()) AS is_overdue
        FROM borrow_records
        INNER JOIN book_copies ON book_copies.id = borrow_records.book_copy_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY borrow_records.borrowed_date DESC
        `,
        values
    );
}

export async function findForStudent(studentId, { from, to } = {}) {
    const conditions = ['borrow_records.student_id = ?'];
    const values = [studentId];

    if (from) {
        conditions.push('borrow_records.borrowed_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('borrow_records.borrowed_date <= ?');
        values.push(to);
    }

    return await query(
        `
        SELECT
            borrow_records.*,
            book_copies.book_id,
            books.title AS book_title,
            books.author AS book_author,
            (borrow_records.status = 'BORROWED' AND borrow_records.due_date < CURDATE()) AS is_overdue
        FROM borrow_records
        INNER JOIN book_copies ON book_copies.id = borrow_records.book_copy_id
        INNER JOIN books ON books.id = book_copies.book_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY borrow_records.borrowed_date DESC
        `,
        values
    );
}

// Guarded by "AND status = 'BORROWED'" so two near-simultaneous returns of
// the same record (a double-click, or two staff members) can't both apply —
// the second call affects 0 rows, and the caller (borrow.service.js) throws
// inside the same transaction rather than also updating the copy's status
// for a return that didn't really "win".
export async function markReturned(id, { status, returnedDate, returnedBy, remarks }, connection = null) {
    const sql = `
        UPDATE borrow_records
        SET status = ?, returned_date = ?, returned_by = ?, remarks = ?
        WHERE id = ? AND status = 'BORROWED'
    `;
    const params = [status, returnedDate, returnedBy ?? null, remarks ?? null, id];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.affectedRows;
    }

    const result = await query(sql, params);
    return result.affectedRows;
}
