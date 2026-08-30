import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO announcements
        (school_id, author_id, title, body, audience_type, audience_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.author_id,
            data.title,
            data.body,
            data.audience_type,
            data.audience_id ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM announcements WHERE id = ?`, [id]);
    return rows[0] || null;
}

// status is optional: omit it to return both PUBLISHED and ARCHIVED rows.
export async function findAll(schoolId, status) {
    if (status) {
        return await query(
            `SELECT * FROM announcements WHERE school_id = ? AND status = ? ORDER BY created_at DESC`,
            [schoolId, status]
        );
    }

    return await query(`SELECT * FROM announcements WHERE school_id = ? ORDER BY created_at DESC`, [schoolId]);
}

// Announcements actually relevant to one student/guardian right now:
// school-wide, plus whichever grade level and class their current
// enrollment puts them in — the inverse of getRecipients() in
// announcement.service.js (that computes "who is this announcement for",
// this computes "which announcements are for this person"). Only
// PUBLISHED rows — an ARCHIVED announcement was never meant to keep
// showing up for its original audience.
export async function findForAudience(schoolId, { classId, gradeLevelId }) {
    return await query(
        `
        SELECT * FROM announcements
        WHERE school_id = ?
        AND status = 'PUBLISHED'
        AND (
            audience_type = 'SCHOOL'
            OR (audience_type = 'GRADE_LEVEL' AND audience_id = ?)
            OR (audience_type = 'CLASS' AND audience_id = ?)
        )
        ORDER BY created_at DESC
        `,
        [schoolId, gradeLevelId ?? null, classId ?? null]
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
        fields.push('title = ?');
        values.push(data.title);
    }

    if (data.body !== undefined) {
        fields.push('body = ?');
        values.push(data.body);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE announcements SET status = ? WHERE id = ?`, [status, id]);
}
