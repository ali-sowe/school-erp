import { query } from '../../database/query.js';

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO import_batches
        (school_id, document_id, target_type, context, total_rows, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.document_id,
            data.target_type,
            data.context ? JSON.stringify(data.context) : null,
            data.total_rows ?? 0,
            createdBy,
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM import_batches WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findAll(schoolId, { targetType, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (targetType) {
        conditions.push('target_type = ?');
        values.push(targetType);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM import_batches WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
        values
    );
}

export async function updateValidationResult(id, { status, validRows, invalidRows, validationError }) {
    await query(
        `
        UPDATE import_batches
        SET status = ?, valid_rows = ?, invalid_rows = ?, validation_error = ?, validated_at = NOW()
        WHERE id = ?
        `,
        [status, validRows, invalidRows, validationError ?? null, id]
    );
}

export async function updateImportResult(id, { status, importedRows, failedRows, confirmedBy }) {
    await query(
        `
        UPDATE import_batches
        SET status = ?, imported_rows = ?, failed_rows = ?, confirmed_by = ?, confirmed_at = NOW(), imported_at = NOW()
        WHERE id = ?
        `,
        [status, importedRows, failedRows, confirmedBy, id]
    );
}

export async function setStatus(id, status) {
    await query(`UPDATE import_batches SET status = ? WHERE id = ?`, [status, id]);
}
