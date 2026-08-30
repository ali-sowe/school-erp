import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO subjects
        (
            school_id,
            name,
            code,
            is_core,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.name,
            data.code,
            data.is_core ?? true,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM subjects WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(schoolId, name) {
    const rows = await query(`SELECT * FROM subjects WHERE school_id = ? AND name = ?`, [schoolId, name]);
    return rows[0] || null;
}

export async function findByCode(schoolId, code) {
    const rows = await query(`SELECT * FROM subjects WHERE school_id = ? AND code = ?`, [schoolId, code]);
    return rows[0] || null;
}

// status is optional: omit it to return both ACTIVE and ARCHIVED rows.
export async function findAll(schoolId, status) {
    if (status) {
        return await query(`SELECT * FROM subjects WHERE school_id = ? AND status = ? ORDER BY name ASC`, [schoolId, status]);
    }

    return await query(`SELECT * FROM subjects WHERE school_id = ? ORDER BY name ASC`, [schoolId]);
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.code !== undefined) {
        fields.push('code = ?');
        values.push(data.code);
    }

    if (data.is_core !== undefined) {
        fields.push('is_core = ?');
        values.push(data.is_core);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE subjects SET status = ? WHERE id = ?`, [status, id]);
}
