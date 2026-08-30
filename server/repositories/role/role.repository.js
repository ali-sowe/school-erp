import { query } from '../../database/query.js';

// schoolId is required for normal school-scoped roles; pass null explicitly
// to read/write platform-level roles (e.g. "Super Administrator").
export async function findAll(schoolId) {
    if (schoolId === undefined) {
        return await query(`SELECT * FROM roles ORDER BY role_name ASC`);
    }

    return await query(
        `SELECT * FROM roles WHERE school_id ${schoolId === null ? 'IS NULL' : '= ?'} ORDER BY role_name ASC`,
        schoolId === null ? [] : [schoolId]
    );
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM roles WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(schoolId, roleName) {
    const rows = await query(
        `SELECT * FROM roles WHERE school_id ${schoolId === null ? 'IS NULL' : '= ?'} AND role_name = ? LIMIT 1`,
        schoolId === null ? [roleName] : [schoolId, roleName]
    );
    return rows[0] || null;
}

// Accepts an optional transaction connection so school onboarding can create
// its default roles atomically with the school row — see school.service.js.
export async function create(data, connection = null) {
    const sql = `INSERT INTO roles (school_id, role_name, description, permissions) VALUES (?, ?, ?, ?)`;
    const params = [
        data.school_id ?? null,
        data.role_name,
        data.description || '',
        JSON.stringify(data.permissions ?? [])
    ];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
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

    if (data.permissions !== undefined) {
        fields.push('permissions = ?');
        values.push(JSON.stringify(data.permissions));
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
