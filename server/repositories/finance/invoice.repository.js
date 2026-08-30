import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO invoices
        (
            school_id,
            student_id,
            academic_year_id,
            term_id,
            fee_structure_id,
            description,
            amount_due,
            due_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.student_id,
            data.academic_year_id,
            data.term_id ?? null,
            data.fee_structure_id ?? null,
            data.description,
            data.amount_due,
            data.due_date ?? null,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM invoices WHERE id = ?`, [id]);
    return rows[0] || null;
}

// Same as findById, but locks the row (FOR UPDATE) — only meaningful inside
// a transaction (see payment.service.js#recordPayment). Two concurrent
// payments against the same invoice must not both validate against the
// same stale amount_paid and together overpay it; this serializes them so
// the second payment's overpayment check sees the first's committed total.
export async function findByIdForUpdate(id, connection) {
    const [rows] = await connection.query(`SELECT * FROM invoices WHERE id = ? FOR UPDATE`, [id]);
    return rows[0] || null;
}

export async function findAll(schoolId, { studentId, academicYearId, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (studentId) {
        conditions.push('student_id = ?');
        values.push(studentId);
    }

    if (academicYearId) {
        conditions.push('academic_year_id = ?');
        values.push(academicYearId);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM invoices WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
        values
    );
}

// Recomputes amount_paid from the invoice's own COMPLETED payments rather
// than incrementing/decrementing a running total — self-correcting if a
// payment is ever voided out of order, at the cost of one extra query per
// payment mutation (financial correctness over micro-optimization here).
// Accepts an optional transaction connection so this always runs atomically
// with the payment write/void that triggered it (see payment.service.js).
export async function recalculateBalance(id, connection = null) {
    const runner = connection ? (sql, params) => connection.query(sql, params).then(([rows]) => rows) : query;

    const sumRows = await runner(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ? AND status = 'COMPLETED'`,
        [id]
    );
    const total = sumRows[0].total;

    const invoiceRows = await runner(`SELECT * FROM invoices WHERE id = ?`, [id]);
    const invoice = invoiceRows[0];

    const amountDue = Number(invoice.amount_due);
    const amountPaid = Number(total);

    let status = 'UNPAID';
    if (amountPaid >= amountDue) {
        status = 'PAID';
    } else if (amountPaid > 0) {
        status = 'PARTIALLY_PAID';
    }

    await runner(
        `UPDATE invoices SET amount_paid = ?, status = ? WHERE id = ?`,
        [amountPaid, status, id]
    );
}

export async function voidInvoice(id, reason) {
    const result = await query(
        `UPDATE invoices SET status = 'VOIDED', reason = ? WHERE id = ? AND status != 'VOIDED'`,
        [reason, id]
    );
    return result.affectedRows;
}

// Simple collection totals for one school's academic year — the "financial
// reporting" requirement in the Finance module doc, kept to one query
// rather than a full reporting subsystem.
export async function getSummary(schoolId, academicYearId) {
    const rows = await query(
        `
        SELECT
            COUNT(*) AS invoice_count,
            COALESCE(SUM(amount_due), 0) AS total_due,
            COALESCE(SUM(amount_paid), 0) AS total_paid
        FROM invoices
        WHERE school_id = ? AND academic_year_id = ? AND status != 'VOIDED'
        `,
        [schoolId, academicYearId]
    );

    return rows[0];
}
