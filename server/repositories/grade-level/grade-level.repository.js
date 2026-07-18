import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO grade_levels
        (
            school_id,
            name,
            education_level,
            sequence_order,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.name,
            data.education_level,
            data.sequence_order ?? 0,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM grade_levels WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(schoolId, name) {
    const rows = await query(`SELECT * FROM grade_levels WHERE school_id = ? AND name = ?`, [schoolId, name]);
    return rows[0] || null;
}

// status is optional: omit it to return both ACTIVE and ARCHIVED rows.
export async function findAll(schoolId, status) {
    if (status) {
        return await query(
            `SELECT * FROM grade_levels WHERE school_id = ? AND status = ? ORDER BY sequence_order ASC, name ASC`,
            [schoolId, status]
        );
    }

    return await query(`SELECT * FROM grade_levels WHERE school_id = ? ORDER BY sequence_order ASC, name ASC`, [schoolId]);
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.education_level !== undefined) {
        fields.push('education_level = ?');
        values.push(data.education_level);
    }

    if (data.sequence_order !== undefined) {
        fields.push('sequence_order = ?');
        values.push(data.sequence_order);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE grade_levels SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE grade_levels SET status = ? WHERE id = ?`, [status, id]);
}
