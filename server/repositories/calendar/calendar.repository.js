import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO calendar_events
        (school_id, academic_year_id, title, description, category, start_date, end_date, is_school_closed, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.academic_year_id,
            data.title,
            data.description ?? null,
            data.category ?? null,
            data.start_date,
            data.end_date,
            data.is_school_closed ?? false,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM calendar_events WHERE id = ?`, [id]);
    return rows[0] || null;
}

// academicYearId and category are exact filters; from/to narrow to events
// that overlap that range at all (not just ones fully contained in it),
// same "does this range touch that range" logic a calendar view needs.
export async function findAll(schoolId, { academicYearId, category, status, from, to } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (academicYearId) {
        conditions.push('academic_year_id = ?');
        values.push(academicYearId);
    }

    if (category) {
        conditions.push('category = ?');
        values.push(category);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (from) {
        conditions.push('end_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('start_date <= ?');
        values.push(to);
    }

    return await query(
        `SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY start_date ASC`,
        values
    );
}

// The one query every integration point (attendance.service.js today,
// exams/fees potentially later) actually needs: is there an active,
// closed-marking event covering this single date. Kept separate from
// findAll rather than asking every caller to filter a full list themselves.
export async function findClosureForDate(schoolId, date) {
    const rows = await query(
        `
        SELECT * FROM calendar_events
        WHERE school_id = ?
        AND status = 'ACTIVE'
        AND is_school_closed = TRUE
        AND ? BETWEEN start_date AND end_date
        LIMIT 1
        `,
        [schoolId, date]
    );

    return rows[0] || null;
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    const editableFields = ['title', 'description', 'category', 'start_date', 'end_date', 'is_school_closed'];

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

    await query(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE calendar_events SET status = ? WHERE id = ?`, [status, id]);
}
