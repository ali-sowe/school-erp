import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO guardians
        (
            school_id,
            first_name,
            last_name,
            phone,
            email,
            address,
            occupation,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.first_name,
            data.last_name,
            data.phone ?? null,
            data.email ?? null,
            data.address ?? null,
            data.occupation ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM guardians WHERE id = ?`, [id]);
    return rows[0] || null;
}

// search and status are both optional filters. Used both for the guardian
// list and to help office staff find an existing guardian by phone/name
// before registering a duplicate for a sibling.
export async function findAll(schoolId, { search, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (search) {
        conditions.push('(phone LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
        const term = `%${search}%`;
        values.push(term, term, term, term);
    }

    return await query(
        `SELECT * FROM guardians WHERE ${conditions.join(' AND ')} ORDER BY last_name ASC, first_name ASC`,
        values
    );
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

    if (data.phone !== undefined) {
        fields.push('phone = ?');
        values.push(data.phone);
    }

    if (data.email !== undefined) {
        fields.push('email = ?');
        values.push(data.email);
    }

    if (data.address !== undefined) {
        fields.push('address = ?');
        values.push(data.address);
    }

    if (data.occupation !== undefined) {
        fields.push('occupation = ?');
        values.push(data.occupation);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE guardians SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE guardians SET status = ? WHERE id = ?`, [status, id]);
}
