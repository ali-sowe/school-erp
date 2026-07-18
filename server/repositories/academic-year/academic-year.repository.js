import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {

    const results = await query(
        `
        INSERT INTO academic_years
        (
            name,
            start_date,
            end_date,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
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


export async function findByName(name) {
    const rows = await query(`SELECT * FROM academic_years WHERE name = ?`, [name]);
    
    return rows[0] || null;
}


export async function findAll() {
    return await query(`SELECT * FROM academic_years ORDER BY start_date DESC`);
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


export async function findActive() {

    const rows = await query(
        `
        SELECT *
        FROM academic_years
        WHERE status = 'ACTIVE'
        LIMIT 1
        `
    );

    return rows[0] || null;
}

export async function activate(id) {
    // Only ever touches the requested row. Blocking a second concurrent
    // ACTIVE year (ADR-002/003: no silent, unaudited side effects on other
    // records) is a business rule and belongs in the service layer, not here.
    await query(
        `
        UPDATE academic_years
        SET status = 'ACTIVE'
        WHERE id = ?
        `,
        [id]
    );
}

export async function complete(id) {
    await query(`UPDATE academic_years SET status = 'COMPLETED' WHERE id = ?`, [id]);
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