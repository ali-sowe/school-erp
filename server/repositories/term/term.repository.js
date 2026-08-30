import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {

    const results = await query(
        `
        INSERT INTO terms
        (
            school_id,
            academic_year_id,
            name,
            start_date,
            end_date,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.academic_year_id,
            data.name,
            data.start_date,
            data.end_date,
            "SCHEDULED",
            createdBy
        ]
    );

    return results.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM terms WHERE id = ?`, [id]);

    return rows[0] || null;
}

export async function findByNameInYear(schoolId, academicYearId, name) {
    const rows = await query(
        `SELECT * FROM terms WHERE school_id = ? AND academic_year_id = ? AND name = ?`,
        [schoolId, academicYearId, name]
    );

    return rows[0] || null;
}

// schoolId is required for a school-scoped listing; leave it undefined to
// scan across all schools (used by the lifecycle job, a background process,
// not a tenant-scoped request) — mirrors academic-year.repository.js.
export async function findAll(schoolId, academicYearId = null) {
    const conditions = [];
    const params = [];

    if (schoolId !== undefined) {
        conditions.push('school_id = ?');
        params.push(schoolId);
    }

    if (academicYearId) {
        conditions.push('academic_year_id = ?');
        params.push(academicYearId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return await query(`SELECT * FROM terms ${whereClause} ORDER BY start_date ASC`, params);
}

export async function findActiveInYear(schoolId, academicYearId) {
    const rows = await query(
        `
        SELECT *
        FROM terms
        WHERE school_id = ?
        AND academic_year_id = ?
        AND status = 'ACTIVE'
        LIMIT 1
        `,
        [schoolId, academicYearId]
    );

    return rows[0] || null;
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
    }

    if (data.start_date !== undefined) {
        fields.push('start_date = ?');
        values.push(data.start_date);
    }

    if (data.end_date !== undefined) {
        fields.push('end_date = ?');
        values.push(data.end_date);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    await query(`UPDATE terms SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function activate(id) {
    // Only ever touches the requested row — the "only one active term per
    // year" rule is a business rule and belongs in the service layer, so it
    // can be blocked with a clear, audited error instead of a silent side effect.
    //
    // actual_start_date is stamped here (if not already set), same reasoning
    // as academic-year.repository.js#activate: the lifecycle job falls back
    // to the planned start_date/end_date whenever actual_* is still NULL, so
    // leaving it unset would let a later lifecycle run recompute status from
    // the plan and undo this.
    await query(
        `UPDATE terms
         SET status = 'ACTIVE',
             actual_start_date = COALESCE(actual_start_date, CURDATE())
         WHERE id = ?`,
        [id]
    );
}

export async function complete(id) {
    // See activate() above — an early manual completion needs actual_end_date
    // stamped too, or the lifecycle job reverts it back to ACTIVE the next
    // time it runs and falls back to the still-future planned end_date.
    await query(
        `UPDATE terms
         SET status = 'COMPLETED',
             actual_end_date = COALESCE(actual_end_date, CURDATE())
         WHERE id = ?`,
        [id]
    );
}

export async function findScheduled() {
    return await query(`SELECT * FROM terms WHERE status = 'SCHEDULED'`);
}

export async function updateLifecycle(id, data) {
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

    values.push(id);

    await query(`UPDATE terms SET ${fields.join(', ')} WHERE id = ?`, values);
}
