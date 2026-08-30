import { query } from '../../database/query.js';

// Rows are inserted one at a time (not a single multi-row INSERT) since
// each row's raw_data is a differently-shaped JSON blob — keeps this
// symmetric with every other repository in the codebase (no query
// builder), at the cost of N queries per batch. Fine at the row counts a
// school's spreadsheets realistically have (tens to low hundreds).
export async function create(data) {
    const result = await query(
        `
        INSERT INTO import_batch_rows
        (import_batch_id, row_number, raw_data, normalized_data, status, errors)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.import_batch_id,
            data.row_number,
            JSON.stringify(data.raw_data),
            data.normalized_data ? JSON.stringify(data.normalized_data) : null,
            data.status,
            data.errors ? JSON.stringify(data.errors) : null,
        ]
    );

    return result.insertId;
}

export async function findByBatchId(importBatchId, { status } = {}) {
    const conditions = ['import_batch_id = ?'];
    const values = [importBatchId];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM import_batch_rows WHERE ${conditions.join(' AND ')} ORDER BY row_number ASC`,
        values
    );
}

export async function updateImportOutcome(id, { status, errors, importedEntityId }) {
    await query(
        `UPDATE import_batch_rows SET status = ?, errors = ?, imported_entity_id = ? WHERE id = ?`,
        [status, errors ? JSON.stringify(errors) : null, importedEntityId ?? null, id]
    );
}
