import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `INSERT INTO expense_categories (school_id, name, description, created_by) VALUES (?, ?, ?, ?)`,
        [data.school_id, data.name, data.description ?? null, createdBy]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM expense_categories WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(schoolId, name) {
    const rows = await query(`SELECT * FROM expense_categories WHERE school_id = ? AND name = ?`, [schoolId, name]);
    return rows[0] || null;
}

// status is optional: omit it to return both ACTIVE and ARCHIVED rows.
export async function findAll(schoolId, status) {
    if (status) {
        return await query(
            `SELECT * FROM expense_categories WHERE school_id = ? AND status = ? ORDER BY name ASC`,
            [schoolId, status]
        );
    }

    return await query(`SELECT * FROM expense_categories WHERE school_id = ? ORDER BY name ASC`, [schoolId]);
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE expense_categories SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE expense_categories SET status = ? WHERE id = ?`, [status, id]);
}
