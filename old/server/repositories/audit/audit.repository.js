import { query } from "../../database/query.js";

export const createAuditLog = async ({
    entityType,
    entityId,
    action,
    oldValues = null,
    newValues = null,
    reason = null,
    performedBy = null
}) => {

    const sql = `
        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            old_values,
            new_values,
            reason,
            performed_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        entityType,
        entityId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        reason,
        performedBy
    ];

    const result = await query(sql, values);

    return result;
};

// Add history fetching
export const getEntityHistory = async (
    entityType,
    entityId
) => {

    const sql = `
        SELECT *
        FROM audit_logs
        WHERE entity_type = ?
        AND entity_id = ?
        ORDER BY created_at DESC
    `;

    return await query(sql, [
        entityType,
        entityId
    ]);
};