import { query } from "../../database/query.js";

export async function create(examId, subjectId, maxScore, createdBy = null) {
    const result = await query(
        `INSERT INTO exam_subjects (exam_id, subject_id, max_score) VALUES (?, ?, ?)`,
        [examId, subjectId, maxScore]
    );

    return result.insertId;
}

export async function findMapping(examId, subjectId) {
    const rows = await query(
        `SELECT * FROM exam_subjects WHERE exam_id = ? AND subject_id = ?`,
        [examId, subjectId]
    );
    return rows[0] || null;
}

// Joined with subjects so callers get subject details in one query, same
// pattern as class-subject.repository.js's findSubjectsForClass.
export async function findSubjectsForExam(examId) {
    return await query(
        `
        SELECT
            exam_subjects.id AS exam_subject_id,
            exam_subjects.max_score,
            subjects.*
        FROM exam_subjects
        INNER JOIN subjects ON subjects.id = exam_subjects.subject_id
        WHERE exam_subjects.exam_id = ?
        ORDER BY subjects.name ASC
        `,
        [examId]
    );
}

export async function remove(examId, subjectId) {
    await query(`DELETE FROM exam_subjects WHERE exam_id = ? AND subject_id = ?`, [examId, subjectId]);
}

export async function countForExam(examId) {
    const rows = await query(`SELECT COUNT(*) AS total FROM exam_subjects WHERE exam_id = ?`, [examId]);
    return Number(rows[0].total);
}
