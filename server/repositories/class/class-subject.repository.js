import { query } from "../../database/query.js";

export async function create(classId, subjectId, createdBy = null) {
    const result = await query(
        `INSERT INTO class_subjects (class_id, subject_id, created_by) VALUES (?, ?, ?)`,
        [classId, subjectId, createdBy]
    );

    return result.insertId;
}

export async function findMapping(classId, subjectId) {
    const rows = await query(
        `SELECT * FROM class_subjects WHERE class_id = ? AND subject_id = ?`,
        [classId, subjectId]
    );

    return rows[0] || null;
}

// Joined with subjects so callers get subject details in one query instead
// of fetching ids and re-querying subjects separately.
export async function findSubjectsForClass(classId) {
    return await query(
        `
        SELECT
            class_subjects.id AS class_subject_id,
            class_subjects.status AS assignment_status,
            class_subjects.created_at AS assigned_at,
            subjects.*
        FROM class_subjects
        INNER JOIN subjects ON subjects.id = class_subjects.subject_id
        WHERE class_subjects.class_id = ?
        AND class_subjects.status = 'ACTIVE'
        ORDER BY subjects.name ASC
        `,
        [classId]
    );
}

export async function remove(classId, subjectId) {
    await query(`DELETE FROM class_subjects WHERE class_id = ? AND subject_id = ?`, [classId, subjectId]);
}
