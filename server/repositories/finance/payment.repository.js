import { query } from "../../database/query.js";

// Accepts an optional transaction connection so a payment can be recorded
// atomically with the invoice balance recalculation — see
// payment.service.js (same pattern as teacher.repository.js).
export async function create(data, createdBy = null, connection = null) {
    const sql = `
        INSERT INTO payments
        (
            school_id,
            invoice_id,
            amount,
            payment_method,
            payment_date,
            reference_number,
            received_by,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.invoice_id,
        data.amount,
        data.payment_method,
        data.payment_date,
        data.reference_number ?? null,
        data.received_by ?? createdBy,
        createdBy
    ];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM payments WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findForInvoice(invoiceId) {
    return await query(
        `SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC`,
        [invoiceId]
    );
}

// School-wide listing, optionally filtered — same conditions-array style
// as invoice.repository.js's findAll. Added for the payments report
// dataset (see services/report/datasets/payments.dataset.js); every other
// function here is scoped to one payment or one invoice, not the whole school.
export async function findAll(schoolId, { invoiceId, status, from, to } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (invoiceId) {
        conditions.push('invoice_id = ?');
        values.push(invoiceId);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    if (from) {
        conditions.push('payment_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('payment_date <= ?');
        values.push(to);
    }

    return await query(
        `SELECT * FROM payments WHERE ${conditions.join(' AND ')} ORDER BY payment_date DESC, id DESC`,
        values
    );
}

export async function voidPayment(id, reason, connection = null) {
    const sql = `UPDATE payments SET status = 'VOIDED', reason = ? WHERE id = ? AND status != 'VOIDED'`;
    const params = [reason, id];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.affectedRows;
    }

    const result = await query(sql, params);
    return result.affectedRows;
}
