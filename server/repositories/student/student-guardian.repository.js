import { query } from "../../database/query.js";

export async function create(studentId, guardianId, { relationship, isPrimaryContact = false }, createdBy = null) {
    const result = await query(
        `
        INSERT INTO student_guardians (student_id, guardian_id, relationship, is_primary_contact, created_by)
        VALUES (?, ?, ?, ?, ?)
        `,
        [studentId, guardianId, relationship, isPrimaryContact ? 1 : 0, createdBy]
    );

    return result.insertId;
}

export async function findLink(studentId, guardianId) {
    const rows = await query(
        `SELECT * FROM student_guardians WHERE student_id = ? AND guardian_id = ?`,
        [studentId, guardianId]
    );

    return rows[0] || null;
}

// Joined with guardians so callers get guardian details in one query
// instead of fetching ids and re-querying guardians separately.
export async function findGuardiansForStudent(studentId) {
    return await query(
        `
        SELECT
            student_guardians.id AS link_id,
            student_guardians.relationship,
            student_guardians.is_primary_contact,
            student_guardians.status AS link_status,
            guardians.*
        FROM student_guardians
        INNER JOIN guardians ON guardians.id = student_guardians.guardian_id
        WHERE student_guardians.student_id = ?
        AND student_guardians.status = 'ACTIVE'
        ORDER BY student_guardians.is_primary_contact DESC, guardians.last_name ASC
        `,
        [studentId]
    );
}

// The inverse view: every student a given guardian is responsible for.
// Useful once a guardian gets portal access and needs to see all their children.
export async function findStudentsForGuardian(guardianId) {
    return await query(
        `
        SELECT
            student_guardians.id AS link_id,
            student_guardians.relationship,
            student_guardians.is_primary_contact,
            student_guardians.status AS link_status,
            students.*
        FROM student_guardians
        INNER JOIN students ON students.id = student_guardians.student_id
        WHERE student_guardians.guardian_id = ?
        AND student_guardians.status = 'ACTIVE'
        ORDER BY students.last_name ASC
        `,
        [guardianId]
    );
}

export async function remove(studentId, guardianId) {
    await query(`DELETE FROM student_guardians WHERE student_id = ? AND guardian_id = ?`, [studentId, guardianId]);
}
