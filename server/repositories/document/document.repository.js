import { query } from '../../database/query.js';

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO documents
        (
            school_id,
            kind,
            category,
            title,
            description,
            related_entity_type,
            related_entity_id,
            original_filename,
            stored_filename,
            storage_path,
            file_extension,
            mime_type,
            file_size_bytes,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.kind,
            data.category ?? 'OTHER',
            data.title,
            data.description ?? null,
            data.related_entity_type ?? null,
            data.related_entity_id ?? null,
            data.original_filename,
            data.stored_filename,
            data.storage_path,
            data.file_extension,
            data.mime_type,
            data.file_size_bytes,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM documents WHERE id = ?`, [id]);
    return rows[0] || null;
}

// search matches title/description/original_filename (simple LIKE — same
// reasoning as books.findAll: a full-text/search-index layer is future
// work, not needed for the storage foundation itself).
export async function findAll(schoolId, { kind, category, status, relatedEntityType, relatedEntityId, search } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (kind) {
        conditions.push('kind = ?');
        values.push(kind);
    }

    if (category) {
        conditions.push('category = ?');
        values.push(category);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (relatedEntityType) {
        conditions.push('related_entity_type = ?');
        values.push(relatedEntityType);
    }

    if (relatedEntityId) {
        conditions.push('related_entity_id = ?');
        values.push(relatedEntityId);
    }

    if (search) {
        conditions.push('(title LIKE ? OR description LIKE ? OR original_filename LIKE ?)');
        const term = `%${search}%`;
        values.push(term, term, term);
    }

    return await query(
        `SELECT * FROM documents WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
        values
    );
}

export async function update(id, data) {
    const fields = [];
    const values = [];

    const editableFields = ['title', 'description', 'category'];

    for (const field of editableFields) {
        if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function setStatus(id, status) {
    await query(`UPDATE documents SET status = ? WHERE id = ?`, [status, id]);
}

// Each field is optional so extraction and preview generation (which run
// independently and can finish in either order, or fail independently) can
// each write only what they know about without clobbering the other.
export async function updateProcessingResult(id, {
    previewStatus,
    previewStoragePath,
    textExtractionStatus,
    extractedText,
    processedAt,
} = {}) {
    const fields = [];
    const values = [];

    if (previewStatus !== undefined) {
        fields.push('preview_status = ?');
        values.push(previewStatus);
    }

    if (previewStoragePath !== undefined) {
        fields.push('preview_storage_path = ?');
        values.push(previewStoragePath);
    }

    if (textExtractionStatus !== undefined) {
        fields.push('text_extraction_status = ?');
        values.push(textExtractionStatus);
    }

    if (extractedText !== undefined) {
        fields.push('extracted_text = ?');
        values.push(extractedText);
    }

    if (processedAt !== undefined) {
        fields.push('processed_at = ?');
        values.push(processedAt);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    await query(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
}

// MATCH...AGAINST in natural language mode over the FULLTEXT index — real
// relevance ranking (best matches first) rather than a LIKE scan. Falls
// back to matching nothing gracefully if the query is too short/is all
// stopwords (MySQL's own behavior), which is fine for this use case.
export async function searchDocuments(schoolId, searchQuery, { status } = {}) {
    const conditions = ['school_id = ?', 'MATCH(title, description, extracted_text) AGAINST (? IN NATURAL LANGUAGE MODE)'];
    const values = [schoolId, searchQuery];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `
        SELECT *, MATCH(title, description, extracted_text) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance
        FROM documents
        WHERE ${conditions.join(' AND ')}
        ORDER BY relevance DESC
        `,
        [searchQuery, ...values]
    );
}
