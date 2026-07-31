import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO books
        (
            school_id,
            title,
            author,
            isbn,
            category,
            publisher,
            description,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.title,
            data.author ?? null,
            data.isbn ?? null,
            data.category ?? null,
            data.publisher ?? null,
            data.description ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM books WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByIsbn(schoolId, isbn) {
    if (!isbn) {
        return null;
    }

    const rows = await query(`SELECT * FROM books WHERE school_id = ? AND isbn = ?`, [schoolId, isbn]);
    return rows[0] || null;
}

// search matches title/author/isbn (simple LIKE — schools' catalogs are
// small enough that full-text search would be over-engineering for now).
export async function findAll(schoolId, { status, category, search } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (category) {
        conditions.push('category = ?');
        values.push(category);
    }

    if (search) {
        conditions.push('(title LIKE ? OR author LIKE ? OR isbn LIKE ?)');
        const term = `%${search}%`;
        values.push(term, term, term);
    }

    return await query(
        `SELECT * FROM books WHERE ${conditions.join(' AND ')} ORDER BY title ASC`,
        values
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    const editableFields = ['title', 'author', 'isbn', 'category', 'publisher', 'description'];

    for (const field of editableFields) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE books SET status = ? WHERE id = ?`, [status, id]);
}

// Copy-count breakdown for a book's detail view — one query rather than the
// caller doing N+1 lookups per book in a list.
export async function getCopyCounts(bookId) {
    const rows = await query(
        `
        SELECT status, COUNT(*) AS total
        FROM book_copies
        WHERE book_id = ?
        GROUP BY status
        `,
        [bookId]
    );

    const counts = { AVAILABLE: 0, BORROWED: 0, LOST: 0, DAMAGED: 0, WITHDRAWN: 0 };
    let total = 0;

    for (const row of rows) {
        counts[row.status] = Number(row.total);
        total += Number(row.total);
    }

    return { ...counts, TOTAL: total };
}
