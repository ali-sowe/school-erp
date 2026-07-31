import { query } from "../../database/query.js";

// Accepts an optional transaction connection so a teacher's profile row can
// be created atomically with its user login — see teacher.service.js
// (same pattern as school.service.js creating a school + its administrator).
export async function create(data, connection = null) {
    const sql = `
        INSERT INTO teachers
        (
            school_id,
            user_id,
            employee_number,
            qualification,
            specialization,
            hire_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.user_id,
        data.employee_number,
        data.qualification ?? null,
        data.specialization ?? null,
        data.hire_date,
        data.created_by ?? null
    ];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
}

// Identity fields (name, email) live on `users`, not here — every read
// joins back to it so callers get one complete record without a second
// round trip.
const SELECT_WITH_USER = `
    SELECT
        teachers.*,
        users.first_name,
        users.last_name,
        users.email,
        users.status AS user_status
    FROM teachers
    INNER JOIN users ON users.id = teachers.user_id
`;

export async function findById(id) {
    const rows = await query(`${SELECT_WITH_USER} WHERE teachers.id = ?`, [id]);
    return rows[0] || null;
}

export async function findByUserId(userId) {
    const rows = await query(`${SELECT_WITH_USER} WHERE teachers.user_id = ?`, [userId]);
    return rows[0] || null;
}

export async function findByEmployeeNumber(schoolId, employeeNumber) {
    const rows = await query(
        `${SELECT_WITH_USER} WHERE teachers.school_id = ? AND teachers.employee_number = ?`,
        [schoolId, employeeNumber]
    );
    return rows[0] || null;
}

// search matches employee number or name (via the joined user), since
// that's how office staff usually look a teacher up — same idea as
// student.repository.js's findAll.
export async function findAll(schoolId, { search, status } = {}) {
    const conditions = ['teachers.school_id = ?'];
    const values = [schoolId];

    if (status) {
        conditions.push('teachers.status = ?');
        values.push(status);
    }

    if (search) {
        conditions.push('(teachers.employee_number LIKE ? OR users.first_name LIKE ? OR users.last_name LIKE ?)');
        const term = `%${search}%`;
        values.push(term, term, term);
    }

    return await query(
        `${SELECT_WITH_USER} WHERE ${conditions.join(' AND ')} ORDER BY users.last_name ASC, users.first_name ASC`,
        values
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.qualification !== undefined) {
        fields.push('qualification = ?');
        values.push(data.qualification);
    }

    if (data.specialization !== undefined) {
        fields.push('specialization = ?');
        values.push(data.specialization);
    }

    if (data.hire_date !== undefined) {
        fields.push('hire_date = ?');
        values.push(data.hire_date);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE teachers SET status = ? WHERE id = ?`, [status, id]);
}

// Counts existing teachers for a school so the service layer can generate a
// sequential fallback employee number (e.g. TCH-000007) when one isn't
// supplied — same reasoning as student.repository.js's countForSchool
// (archived rows still count, so numbers are never reused).
export async function countForSchool(schoolId) {
    const rows = await query(`SELECT COUNT(*) AS total FROM teachers WHERE school_id = ?`, [schoolId]);
    return rows[0]?.total ?? 0;
}
