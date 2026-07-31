import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO teacher_subject_assignments
        (
            school_id,
            teacher_id,
            class_id,
            subject_id,
            academic_year_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.teacher_id,
            data.class_id,
            data.subject_id,
            data.academic_year_id,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM teacher_subject_assignments WHERE id = ?`, [id]);
    return rows[0] || null;
}

// One assignment per (class, subject, year) — this is what lets the
// service decide "create" vs "reassign" without a second lookup.
export async function findByClassSubjectYear(classId, subjectId, academicYearId) {
    const rows = await query(
        `SELECT * FROM teacher_subject_assignments WHERE class_id = ? AND subject_id = ? AND academic_year_id = ?`,
        [classId, subjectId, academicYearId]
    );
    return rows[0] || null;
}

// Every subject a class is taught this year, with the assigned teacher's
// name joined in — one query for the whole "class timetable roster".
export async function findForClass(classId, academicYearId) {
    return await query(
        `
        SELECT
            teacher_subject_assignments.*,
            subjects.name AS subject_name,
            subjects.code AS subject_code,
            users.first_name AS teacher_first_name,
            users.last_name AS teacher_last_name
        FROM teacher_subject_assignments
        INNER JOIN subjects ON subjects.id = teacher_subject_assignments.subject_id
        INNER JOIN teachers ON teachers.id = teacher_subject_assignments.teacher_id
        INNER JOIN users ON users.id = teachers.user_id
        WHERE teacher_subject_assignments.class_id = ?
          AND teacher_subject_assignments.academic_year_id = ?
        ORDER BY subjects.name ASC
        `,
        [classId, academicYearId]
    );
}

// Everything one teacher is assigned to teach, optionally narrowed to one
// academic year — what a teacher's own "my classes" view is built from.
export async function findForTeacher(teacherId, academicYearId) {
    const conditions = ['teacher_subject_assignments.teacher_id = ?'];
    const values = [teacherId];

    if (academicYearId) {
        conditions.push('teacher_subject_assignments.academic_year_id = ?');
        values.push(academicYearId);
    }

    return await query(
        `
        SELECT
            teacher_subject_assignments.*,
            classes.name AS class_name,
            subjects.name AS subject_name,
            subjects.code AS subject_code
        FROM teacher_subject_assignments
        INNER JOIN classes ON classes.id = teacher_subject_assignments.class_id
        INNER JOIN subjects ON subjects.id = teacher_subject_assignments.subject_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY teacher_subject_assignments.academic_year_id DESC, classes.name ASC
        `,
        values
    );
}

export async function updateTeacher(id, teacherId) {
    await query(`UPDATE teacher_subject_assignments SET teacher_id = ? WHERE id = ?`, [teacherId, id]);
}

export async function setStatus(id, status) {
    await query(`UPDATE teacher_subject_assignments SET status = ? WHERE id = ?`, [status, id]);
}
