import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO exams
        (
            school_id,
            class_id,
            academic_year_id,
            term_id,
            name,
            exam_type,
            planned_start_date,
            planned_end_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.class_id,
            data.academic_year_id,
            data.term_id,
            data.name,
            data.exam_type ?? 'END_OF_TERM',
            data.planned_start_date,
            data.planned_end_date,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM exams WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByNameInScope(classId, academicYearId, name) {
    const rows = await query(
        `SELECT * FROM exams WHERE class_id = ? AND academic_year_id = ? AND name = ?`,
        [classId, academicYearId, name]
    );
    return rows[0] || null;
}

export async function findAll(schoolId, { classId, academicYearId, termId, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (classId) {
        conditions.push('class_id = ?');
        values.push(classId);
    }

    if (academicYearId) {
        conditions.push('academic_year_id = ?');
        values.push(academicYearId);
    }

    if (termId) {
        conditions.push('term_id = ?');
        values.push(termId);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM exams WHERE ${conditions.join(' AND ')} ORDER BY planned_start_date DESC`,
        values
    );
}

// Nearest upcoming exams school-wide (not scoped to one class), for the
// dashboard's "upcoming events" card. CANCELLED exams are excluded since a
// cancelled exam isn't something coming up anymore.
export async function findUpcoming(schoolId, { from, limit = 5 } = {}) {
    return await query(
        `
        SELECT *
        FROM exams
        WHERE school_id = ?
            AND planned_start_date >= ?
            AND status != 'CANCELLED'
        ORDER BY planned_start_date ASC
        LIMIT ?
        `,
        [schoolId, from, limit]
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.exam_type !== undefined) {
        fields.push('exam_type = ?');
        values.push(data.exam_type);
    }

    if (data.planned_start_date !== undefined) {
        fields.push('planned_start_date = ?');
        values.push(data.planned_start_date);
    }

    if (data.planned_end_date !== undefined) {
        fields.push('planned_end_date = ?');
        values.push(data.planned_end_date);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setLifecycle(id, data) {
    const fields = ['status = ?'];
    const values = [data.status];

    if (data.actual_start_date !== undefined) {
        fields.push('actual_start_date = ?');
        values.push(data.actual_start_date);
    }

    if (data.actual_end_date !== undefined) {
        fields.push('actual_end_date = ?');
        values.push(data.actual_end_date);
    }

    if (data.reason !== undefined) {
        fields.push('reason = ?');
        values.push(data.reason);
    }

    values.push(id);

    await query(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`, values);
}
