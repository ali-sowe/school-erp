import { query } from "../../database/query.js";

export const createAuditLog = async ({
    schoolId = null,
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
            school_id,
            entity_type,
            entity_id,
            action,
            old_values,
            new_values,
            reason,
            performed_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        schoolId,
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

// Most recent actions across the whole school, regardless of entity type —
// the feed the dashboard's "recent activity" card needs, vs.
// getEntityHistory which is scoped to one specific record. Joins users for
// a display name since the frontend just wants a readable description, not
// raw performed_by ids.
export const getRecentForSchool = async (schoolId, limit = 10) => {
    const sql = `
        SELECT
            audit_logs.id,
            audit_logs.entity_type,
            audit_logs.entity_id,
            audit_logs.action,
            audit_logs.created_at,
            users.first_name AS actor_first_name,
            users.last_name AS actor_last_name
        FROM audit_logs
        LEFT JOIN users ON users.id = audit_logs.performed_by
        WHERE audit_logs.school_id = ?
        ORDER BY audit_logs.created_at DESC
        LIMIT ?
    `;

    return await query(sql, [schoolId, limit]);
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