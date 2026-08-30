import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO fee_structures
        (
            school_id,
            academic_year_id,
            grade_level_id,
            name,
            amount,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.academic_year_id,
            data.grade_level_id ?? null,
            data.name,
            data.amount,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM fee_structures WHERE id = ?`, [id]);
    return rows[0] || null;
}

// grade_level_id may be null (a school-wide fee) — matched explicitly since
// `= NULL` never matches in SQL.
export async function findByNameInScope(academicYearId, gradeLevelId, name) {
    const rows = gradeLevelId === null || gradeLevelId === undefined
        ? await query(
            `SELECT * FROM fee_structures WHERE academic_year_id = ? AND grade_level_id IS NULL AND name = ?`,
            [academicYearId, name]
        )
        : await query(
            `SELECT * FROM fee_structures WHERE academic_year_id = ? AND grade_level_id = ? AND name = ?`,
            [academicYearId, gradeLevelId, name]
        );

    return rows[0] || null;
}

export async function findAll(schoolId, { academicYearId, gradeLevelId, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (academicYearId) {
        conditions.push('academic_year_id = ?');
        values.push(academicYearId);
    }

    if (gradeLevelId) {
        conditions.push('grade_level_id = ?');
        values.push(gradeLevelId);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM fee_structures WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
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

    if (data.amount !== undefined) {
        fields.push('amount = ?');
        values.push(data.amount);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE fee_structures SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE fee_structures SET status = ? WHERE id = ?`, [status, id]);
}
