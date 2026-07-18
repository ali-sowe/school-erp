import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO student_enrollments
        (
            school_id,
            student_id,
            academic_year_id,
            class_id,
            enrolled_date,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.student_id,
            data.academic_year_id,
            data.class_id,
            data.enrolled_date,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM student_enrollments WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByStudentAndYear(studentId, academicYearId) {
    const rows = await query(
        `SELECT * FROM student_enrollments WHERE student_id = ? AND academic_year_id = ?`,
        [studentId, academicYearId]
    );
    return rows[0] || null;
}

// Full enrollment history for one student, most recent academic year first.
export async function findForStudent(studentId) {
    return await query(
        `SELECT * FROM student_enrollments WHERE student_id = ? ORDER BY academic_year_id DESC`,
        [studentId]
    );
}

// The class roster: every student enrolled in a class for a given academic
// year, joined with student details so callers don't need a second query.
export async function findRoster(classId, academicYearId, status) {
    const conditions = ['class_id = ?', 'academic_year_id = ?'];
    const values = [classId, academicYearId];

    if (status) {
        conditions.push('student_enrollments.status = ?');
        values.push(status);
    }

    return await query(
        `
        SELECT
            student_enrollments.id AS enrollment_id,
            student_enrollments.status AS enrollment_status,
            student_enrollments.enrolled_date,
            students.*
        FROM student_enrollments
        INNER JOIN students ON students.id = student_enrollments.student_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY students.last_name ASC, students.first_name ASC
        `,
        values
    );
}

export async function updateClass(id, classId) {
    await query(`UPDATE student_enrollments SET class_id = ? WHERE id = ?`, [classId, id]);
}

export async function setStatus(id, status, reason = null) {
    await query(`UPDATE student_enrollments SET status = ?, reason = ? WHERE id = ?`, [status, reason, id]);
}
