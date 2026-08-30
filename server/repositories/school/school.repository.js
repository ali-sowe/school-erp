import { query } from "../../database/query.js";

// Accepts an optional transaction connection so onboarding (school +
// its first Administrator) can be created atomically — see school.service.js.
export async function create(data, connection = null) {
    const sql = `
        INSERT INTO schools (name, slug, ownership_type, region, education_levels, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `;
    const params = [
        data.name,
        data.slug,
        data.ownership_type || null,
        data.region || null,
        data.education_levels ? JSON.stringify(data.education_levels) : null
    ];

    if (connection) {
        // A raw mysql2 connection returns a [result, fields] tuple.
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    // The query() helper already unwraps that tuple for us.
    const result = await query(sql, params);
    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM schools WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByName(name) {
    const rows = await query(`SELECT * FROM schools WHERE name = ?`, [name]);
    return rows[0] || null;
}

export async function findBySlug(slug) {
    const rows = await query(`SELECT * FROM schools WHERE slug = ?`, [slug]);
    return rows[0] || null;
}

export async function findAll() {
    return await query(`SELECT * FROM schools ORDER BY name ASC`);
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.ownership_type !== undefined) {
        fields.push('ownership_type = ?');
        values.push(data.ownership_type);
    }

    if (data.region !== undefined) {
        fields.push('region = ?');
        values.push(data.region);
    }

    if (data.education_levels !== undefined) {
        fields.push('education_levels = ?');
        values.push(JSON.stringify(data.education_levels));
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE schools SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE schools SET status = ? WHERE id = ?`, [status, id]);
}
