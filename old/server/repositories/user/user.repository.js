import { query } from '../../database/query.js';

export async function create(data) {
    const result = await query(
        `
        INSERT INTO users (
            user_code,
            first_name,
            last_name,
            email,
            password,
            role_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.user_code,
            data.first_name,
            data.last_name,
            data.email,
            data.password,
            data.role_id,
            data.status || 'active'
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByEmail(email) {
    const rows = await query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
    return rows[0] || null;
}

export async function findAll() {
    return await query(`
        SELECT u.*, r.role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
    `);
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.first_name !== undefined) {
        fields.push('first_name = ?');
        values.push(data.first_name);
    }

    if (data.last_name !== undefined) {
        fields.push('last_name = ?');
        values.push(data.last_name);
    }

    if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
    }

    if (data.password !== undefined) {
        fields.push('password = ?');
        values.push(data.password);
    }

    if (data.role_id !== undefined) {
        fields.push('role_id = ?');
        values.push(data.role_id);
    }

    if (data.status !== undefined) {
        fields.push('status = ?');
        values.push(data.status);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function remove(id) {
    await query(`DELETE FROM users WHERE id = ?`, [id]);
}
