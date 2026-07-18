import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {

    const results = await query(
        `
        INSERT INTO academic_years
        (
            school_id,
            name,
            start_date,
            end_date,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
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
    const rows = await query(`SELECT * FROM academic_years WHERE id = ?`, [id]);

    return rows[0] || null;
}


export async function findByName(schoolId, name) {
    const rows = await query(`SELECT * FROM academic_years WHERE school_id = ? AND name = ?`, [schoolId, name]);

    return rows[0] || null;
}


// schoolId is required for a school-scoped listing; leave it undefined to
// scan across all schools (used by the lifecycle job, which is a background
// process, not a tenant-scoped request).
export async function findAll(schoolId) {
    if (schoolId === undefined) {
        return await query(`SELECT * FROM academic_years ORDER BY start_date DESC`);
    }

    return await query(`SELECT * FROM academic_years WHERE school_id = ? ORDER BY start_date DESC`, [schoolId]);
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

    await query(`UPDATE academic_years SET ${fields.join(', ')} WHERE id = ?`, values);
}


export async function findActive(schoolId) {

    const rows = await query(
        `
        SELECT *
        FROM academic_years
        WHERE school_id = ?
        AND status = 'ACTIVE'
        LIMIT 1
        `,
        [schoolId]
    );

    return rows[0] || null;
}

export async function activate(id) {
    // Only ever touches the requested row. Blocking a second concurrent
    // ACTIVE year (ADR-002/003: no silent, unaudited side effects on other
    // records) is a business rule and belongs in the service layer, not here.
    //
    // actual_start_date is stamped here (if not already set) alongside the
    // status. The lifecycle job recomputes status from
    // actual_start_date/actual_end_date, falling back to the *planned*
    // start_date/end_date only when the actual_* column is still NULL — so
    // leaving actual_start_date unset here would let the next lifecycle run
    // recalculate from the plan and silently flip status back.
    await query(
        `
        UPDATE academic_years
        SET status = 'ACTIVE',
            actual_start_date = COALESCE(actual_start_date, CURDATE())
        WHERE id = ?
        `,
        [id]
    );
}

export async function complete(id) {
    // See activate() above: actual_end_date must be stamped here too, or an
    // early manual completion (e.g. emergency closure) gets reverted back to
    // ACTIVE the next time the lifecycle job runs and falls back to the
    // still-future planned end_date.
    await query(
        `
        UPDATE academic_years
        SET status = 'COMPLETED',
            actual_end_date = COALESCE(actual_end_date, CURDATE())
        WHERE id = ?
        `,
        [id]
    );
}


export async function findScheduled(){

    return await query(
        `
        SELECT *
        FROM academic_years
        WHERE status = 'SCHEDULED'
        `
    );

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

    await query(`UPDATE academic_years SET ${fields.join(', ')} WHERE id = ?`, values);
}
