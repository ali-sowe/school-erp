import { query } from '../../database/query.js';

export async function findAll() {
    return await query(`SELECT * FROM roles ORDER BY role_name ASC`);
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM roles WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(roleName) {
    const rows = await query(`SELECT * FROM roles WHERE role_name = ? LIMIT 1`, [roleName]);
    return rows[0] || null;
}

export async function create(data) {
    const result = await query(
        `INSERT INTO roles (role_name, description) VALUES (?, ?)`,
        [data.role_name, data.description || '']
    );
    return result.insertId;
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.role_name !== undefined) {
        fields.push('role_name = ?');
        values.push(data.role_name);
    }

    if (data.description !== undefined) {
        fields.push('description = ?');
        values.push(data.description);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function remove(id) {
    await query(`DELETE FROM roles WHERE id = ?`, [id]);
}
