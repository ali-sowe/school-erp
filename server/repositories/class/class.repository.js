import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO classes
        (
            school_id,
            grade_level_id,
            name,
            capacity,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.grade_level_id,
            data.name,
            data.capacity ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM classes WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByNameInGradeLevel(gradeLevelId, name) {
    const rows = await query(`SELECT * FROM classes WHERE grade_level_id = ? AND name = ?`, [gradeLevelId, name]);
    return rows[0] || null;
}

// gradeLevelId and status are both optional filters.
export async function findAll(schoolId, { gradeLevelId, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (gradeLevelId) {
        conditions.push('grade_level_id = ?');
        values.push(gradeLevelId);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM classes WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
        values
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.capacity !== undefined) {
        fields.push('capacity = ?');
        values.push(data.capacity);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE classes SET status = ? WHERE id = ?`, [status, id]);
}
