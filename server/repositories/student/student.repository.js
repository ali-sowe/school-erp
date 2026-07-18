import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO students
        (
            school_id,
            admission_number,
            first_name,
            last_name,
            gender,
            date_of_birth,
            admission_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.admission_number,
            data.first_name,
            data.last_name,
            data.gender ?? null,
            data.date_of_birth ?? null,
            data.admission_date,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM students WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByAdmissionNumber(schoolId, admissionNumber) {
    const rows = await query(
        `SELECT * FROM students WHERE school_id = ? AND admission_number = ?`,
        [schoolId, admissionNumber]
    );
    return rows[0] || null;
}

// Counts existing students for a school so the service layer can generate a
// sequential fallback admission number (e.g. STU-000007) when one isn't
// supplied. Counting rather than tracking a separate counter keeps this
// simple and correct even if a row is later archived (archived rows still
// count, so numbers are never reused).
export async function countForSchool(schoolId) {
    const rows = await query(`SELECT COUNT(*) AS total FROM students WHERE school_id = ?`, [schoolId]);
    return rows[0]?.total ?? 0;
}

// search and status are both optional filters. search matches admission
// number or name, since that's how office staff usually look a student up.
export async function findAll(schoolId, { search, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (search) {
        conditions.push('(admission_number LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
        const term = `%${search}%`;
        values.push(term, term, term);
    }

    return await query(
        `SELECT * FROM students WHERE ${conditions.join(' AND ')} ORDER BY last_name ASC, first_name ASC`,
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

    if (data.gender !== undefined) {
        fields.push('gender = ?');
        values.push(data.gender);
    }

    if (data.date_of_birth !== undefined) {
        fields.push('date_of_birth = ?');
        values.push(data.date_of_birth);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE students SET status = ? WHERE id = ?`, [status, id]);
}
