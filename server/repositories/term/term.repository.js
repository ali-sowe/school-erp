import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {

    const results = await query(
        `
        INSERT INTO terms
        (
            academic_year_id,
            name,
            start_date,
            end_date,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
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

export async function findByNameInYear(academicYearId, name) {
    const rows = await query(
        `SELECT * FROM terms WHERE academic_year_id = ? AND name = ?`,
        [academicYearId, name]
    );

    return rows[0] || null;
}

export async function findAll(academicYearId = null) {
    if (academicYearId) {
        return await query(
            `SELECT * FROM terms WHERE academic_year_id = ? ORDER BY start_date ASC`,
            [academicYearId]
        );
    }

    return await query(`SELECT * FROM terms ORDER BY start_date ASC`);
}

export async function findActiveInYear(academicYearId) {
    const rows = await query(
        `
        SELECT *
        FROM terms
        WHERE academic_year_id = ?
        AND status = 'ACTIVE'
        LIMIT 1
        `,
        [academicYearId]
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
    await query(`UPDATE terms SET status = 'ACTIVE' WHERE id = ?`, [id]);
}

export async function complete(id) {
    await query(`UPDATE terms SET status = 'COMPLETED' WHERE id = ?`, [id]);
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
