import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO expenses
        (school_id, category_id, academic_year_id, title, description, amount, expense_date, vendor_name, payment_method, reference_number, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.category_id,
            data.academic_year_id,
            data.title,
            data.description ?? null,
            data.amount,
            data.expense_date,
            data.vendor_name ?? null,
            data.payment_method ?? null,
            data.reference_number ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function attachApprovalRequest(id, approvalRequestId) {
    await query(`UPDATE expenses SET approval_request_id = ? WHERE id = ?`, [approvalRequestId, id]);
}

// Status, workflow chain state, and who requested it never live redundantly
// on expenses — this join is the one place they're read back together. See
// schema.js's comment on the table for why (mirrors leave_requests).
const SELECT_WITH_STATUS = `
    SELECT
        e.*,
        ar.status AS status,
        ar.title AS approval_title,
        ar.executed_at AS executed_at
    FROM expenses e
    LEFT JOIN approval_requests ar ON ar.id = e.approval_request_id
`;

export async function findById(id) {
    const rows = await query(`${SELECT_WITH_STATUS} WHERE e.id = ?`, [id]);
    return rows[0] || null;
}

export async function findAll(schoolId, { categoryId, academicYearId, status } = {}) {
    const conditions = ['e.school_id = ?'];
    const values = [schoolId];

    if (categoryId) {
        conditions.push('e.category_id = ?');
        values.push(categoryId);
    }

    if (academicYearId) {
        conditions.push('e.academic_year_id = ?');
        values.push(academicYearId);
    }

    if (status) {
        conditions.push('ar.status = ?');
        values.push(status);
    }

    return await query(
        `${SELECT_WITH_STATUS} WHERE ${conditions.join(' AND ')} ORDER BY e.expense_date DESC`,
        values
    );
}

// Sums are computed only over EXECUTED expenses — a request that's merely
// PENDING_REVIEW or APPROVED-but-not-yet-executed isn't a real cost yet,
// the same distinction ADR-004 draws between "approved" and "executed".
export async function getSummary(schoolId, academicYearId) {
    return await query(
        `
        SELECT
            ec.id AS category_id,
            ec.name AS category_name,
            COALESCE(SUM(e.amount), 0) AS total_amount,
            COUNT(e.id) AS expense_count
        FROM expense_categories ec
        LEFT JOIN expenses e
            ON e.category_id = ec.id
            AND e.academic_year_id = ?
            AND e.approval_request_id IN (
                SELECT id FROM approval_requests WHERE status = 'EXECUTED'
            )
        WHERE ec.school_id = ?
        GROUP BY ec.id, ec.name
        ORDER BY ec.name ASC
        `,
        [academicYearId, schoolId]
    );
}
