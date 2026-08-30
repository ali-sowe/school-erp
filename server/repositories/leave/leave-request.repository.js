import { query } from '../../database/query.js';

export async function create(data) {
    const result = await query(
        `
        INSERT INTO leave_requests
        (school_id, user_id, leave_type, start_date, end_date, reason)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.user_id,
            data.leave_type ?? 'OTHER',
            data.start_date,
            data.end_date,
            data.reason ?? null,
        ]
    );

    return result.insertId;
}

export async function attachApprovalRequest(id, approvalRequestId) {
    await query(`UPDATE leave_requests SET approval_request_id = ? WHERE id = ?`, [approvalRequestId, id]);
}

// Status, workflow chain state, and the requester never live redundantly on
// leave_requests — this join is the one place they're read back together.
// See schema.js's comment on the table for why.
const SELECT_WITH_STATUS = `
    SELECT
        lr.*,
        ar.status AS status,
        ar.title AS approval_title,
        ar.executed_at AS executed_at
    FROM leave_requests lr
    LEFT JOIN approval_requests ar ON ar.id = lr.approval_request_id
`;

export async function findById(id) {
    const rows = await query(`${SELECT_WITH_STATUS} WHERE lr.id = ?`, [id]);
    return rows[0] || null;
}

export async function findAll(schoolId, { userId, status, leaveType } = {}) {
    const conditions = ['lr.school_id = ?'];
    const values = [schoolId];

    if (userId) {
        conditions.push('lr.user_id = ?');
        values.push(userId);
    }

    if (status) {
        conditions.push('ar.status = ?');
        values.push(status);
    }

    if (leaveType) {
        conditions.push('lr.leave_type = ?');
        values.push(leaveType);
    }

    return await query(
        `${SELECT_WITH_STATUS} WHERE ${conditions.join(' AND ')} ORDER BY lr.created_at DESC`,
        values
    );
}

// A leave request "counts" as blocking a new overlapping request unless it
// was rejected or cancelled — pending review and approved (even if not yet
// "executed", which for leave has no further side effect) both still hold
// the dates.
const BLOCKING_STATUSES = ['PENDING_REVIEW', 'APPROVED', 'EXECUTED'];

export async function findOverlapping(userId, startDate, endDate) {
    const statusPlaceholders = BLOCKING_STATUSES.map(() => '?').join(', ');

    return await query(
        `
        ${SELECT_WITH_STATUS}
        WHERE lr.user_id = ?
          AND ar.status IN (${statusPlaceholders})
          AND lr.start_date <= ?
          AND lr.end_date >= ?
        `,
        [userId, ...BLOCKING_STATUSES, endDate, startDate]
    );
}
