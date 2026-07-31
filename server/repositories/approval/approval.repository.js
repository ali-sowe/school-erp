import { query } from "../../database/query.js";

export async function create(data, connection) {
    const sql = `
        INSERT INTO approval_requests
        (school_id, workflow_type, entity_type, entity_id, title, description, metadata, requested_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.workflow_type,
        data.entity_type ?? null,
        data.entity_id ?? null,
        data.title,
        data.description ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.requested_by ?? null
    ];

    const [result] = await connection.query(sql, params);
    return result.insertId;
}

export async function createStep(data, connection) {
    const sql = `
        INSERT INTO approval_steps
        (approval_request_id, step_number, approver_user_id, approver_role_name)
        VALUES (?, ?, ?, ?)
    `;
    const params = [
        data.approval_request_id,
        data.step_number,
        data.approver_user_id ?? null,
        data.approver_role_name ?? null
    ];

    const [result] = await connection.query(sql, params);
    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM approval_requests WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findSteps(approvalRequestId) {
    return await query(
        `SELECT * FROM approval_steps WHERE approval_request_id = ? ORDER BY step_number ASC`,
        [approvalRequestId]
    );
}

// The chain is worked strictly in step_number order: the "current" step is
// always whichever PENDING row has the lowest step_number for this request,
// derived here rather than tracked in a separate counter column that could
// drift out of sync with the steps themselves.
export async function findCurrentStep(approvalRequestId) {
    const rows = await query(
        `
        SELECT *
        FROM approval_steps
        WHERE approval_request_id = ? AND status = 'PENDING'
        ORDER BY step_number ASC
        LIMIT 1
        `,
        [approvalRequestId]
    );
    return rows[0] || null;
}

export async function findAll(schoolId, { status, workflowType, entityType, entityId, requestedBy } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (workflowType) {
        conditions.push('workflow_type = ?');
        values.push(workflowType);
    }

    if (entityType) {
        conditions.push('entity_type = ?');
        values.push(entityType);
    }

    if (entityId) {
        conditions.push('entity_id = ?');
        values.push(entityId);
    }

    if (requestedBy) {
        conditions.push('requested_by = ?');
        values.push(requestedBy);
    }

    return await query(
        `SELECT * FROM approval_requests WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
        values
    );
}

// "My pending approvals": requests still under review whose current
// (lowest-step_number PENDING) step is assigned to this user, either by
// name or by role. The correlated subquery is what enforces "current" --
// a step that isn't the lowest-numbered PENDING one for its request is a
// future stage, not something waiting on this user yet.
export async function findPendingForApprover(schoolId, userId, roleName) {
    return await query(
        `
        SELECT ar.*, s.id AS step_id, s.step_number, s.approver_user_id, s.approver_role_name
        FROM approval_requests ar
        INNER JOIN approval_steps s ON s.approval_request_id = ar.id
        WHERE ar.school_id = ?
          AND ar.status = 'PENDING_REVIEW'
          AND s.status = 'PENDING'
          AND s.step_number = (
              SELECT MIN(s2.step_number)
              FROM approval_steps s2
              WHERE s2.approval_request_id = ar.id AND s2.status = 'PENDING'
          )
          AND (s.approver_user_id = ? OR s.approver_role_name = ?)
        ORDER BY ar.created_at ASC
        `,
        [schoolId, userId, roleName ?? '']
    );
}

export async function updateStatus(id, status, connection) {
    const runner = connection ? (sql, params) => connection.query(sql, params) : (sql, params) => query(sql, params);
    await runner(`UPDATE approval_requests SET status = ? WHERE id = ?`, [status, id]);
}

export async function setExecuted(id, executedBy) {
    await query(
        `UPDATE approval_requests SET status = 'EXECUTED', executed_by = ?, executed_at = NOW() WHERE id = ?`,
        [executedBy, id]
    );
}

// Guarded by "AND status = 'PENDING'" so two near-simultaneous decisions on
// the same step (a double-click, or two co-approvers) can't silently
// overwrite each other — the second call affects 0 rows, and the caller
// (approval.service.js) treats that as ALREADY_DECIDED rather than
// proceeding as if its decision were the one that landed.
export async function decideStep(stepId, { status, decidedBy, comment }, connection) {
    const sql = `
        UPDATE approval_steps
        SET status = ?, decided_by = ?, decided_at = NOW(), comment = ?
        WHERE id = ? AND status = 'PENDING'
    `;
    const params = [status, decidedBy, comment ?? null, stepId];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.affectedRows;
    }

    const result = await query(sql, params);
    return result.affectedRows;
}

// Called when a request is rejected or cancelled: any step still sitting at
// PENDING (the one just acted on is already updated separately, and any
// later stages were never reached) would otherwise show as "still waiting"
// forever in the approval history, when the request is actually done.
export async function skipPendingSteps(approvalRequestId) {
    await query(
        `UPDATE approval_steps SET status = 'SKIPPED' WHERE approval_request_id = ? AND status = 'PENDING'`,
        [approvalRequestId]
    );
}
