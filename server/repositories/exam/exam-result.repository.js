import { query } from "../../database/query.js";

// Accepts an optional transaction connection — mirrors attendance.repository.js's
// create(), since result entry is also an all-or-nothing batch write.
export async function create(data, connection = null) {
    const sql = `
        INSERT INTO exam_results
        (
            school_id,
            exam_id,
            subject_id,
            student_id,
            score,
            max_score,
            remarks,
            recorded_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.exam_id,
        data.subject_id,
        data.student_id,
        data.score,
        data.max_score,
        data.remarks ?? null,
        data.recorded_by ?? null
    ];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
}

export async function update(id, data, connection = null) {
    const fields = [];
    const values = [];

    if (data.score !== undefined) {
        fields.push('score = ?');
        values.push(data.score);
    }

    if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);

    const sql = `UPDATE exam_results SET ${fields.join(', ')} WHERE id = ?`;

    if (connection) {
        await connection.query(sql, values);
        return;
    }

    await query(sql, values);
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM exam_results WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByStudentSubjectExam(studentId, subjectId, examId) {
    const rows = await query(
        `SELECT * FROM exam_results WHERE student_id = ? AND subject_id = ? AND exam_id = ?`,
        [studentId, subjectId, examId]
    );
    return rows[0] || null;
}

export async function findForExam(examId, subjectId = null) {
    if (subjectId) {
        return await query(
            `SELECT * FROM exam_results WHERE exam_id = ? AND subject_id = ? ORDER BY student_id ASC`,
            [examId, subjectId]
        );
    }

    return await query(`SELECT * FROM exam_results WHERE exam_id = ? ORDER BY subject_id ASC, student_id ASC`, [examId]);
}

export async function findForStudent(studentId, { academicYearId, termId } = {}) {
    const conditions = ['exam_results.student_id = ?'];
    const values = [studentId];

    if (academicYearId) {
        conditions.push('exams.academic_year_id = ?');
        values.push(academicYearId);
    }

    if (termId) {
        conditions.push('exams.term_id = ?');
        values.push(termId);
    }

    return await query(
        `
        SELECT exam_results.*, exams.name AS exam_name, exams.exam_type, subjects.name AS subject_name
        FROM exam_results
        INNER JOIN exams ON exams.id = exam_results.exam_id
        INNER JOIN subjects ON subjects.id = exam_results.subject_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY exams.planned_start_date DESC
        `,
        values
    );
}

export async function countForExamSubject(examId, subjectId) {
    const rows = await query(
        `SELECT COUNT(*) AS total FROM exam_results WHERE exam_id = ? AND subject_id = ?`,
        [examId, subjectId]
    );
    return Number(rows[0].total);
}

// Lightweight per-subject stats for an exam's results — mirrors the
// per-status attendance summary (attendance.repository.js's getClassSummary).
export async function getSubjectStats(examId) {
    return await query(
        `
        SELECT
            subject_id,
            COUNT(*) AS result_count,
            AVG(score) AS average_score,
            MIN(score) AS lowest_score,
            MAX(score) AS highest_score
        FROM exam_results
        WHERE exam_id = ?
        GROUP BY subject_id
        `,
        [examId]
    );
}
