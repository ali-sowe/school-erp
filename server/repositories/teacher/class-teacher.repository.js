import { query } from "../../database/query.js";

export async function create(data, createdBy = null) {
    const result = await query(
        `
        INSERT INTO class_teachers
        (
            school_id,
            class_id,
            teacher_id,
            academic_year_id,
            created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.school_id,
            data.class_id,
            data.teacher_id,
            data.academic_year_id,
            createdBy
        ]
    );

    return result.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM class_teachers WHERE id = ?`, [id]);
    return rows[0] || null;
}

// One class teacher per (class, year) — same "create vs reassign" decision
// point as teacher_subject_assignments.findByClassSubjectYear.
export async function findByClassAndYear(classId, academicYearId) {
    const rows = await query(
        `SELECT * FROM class_teachers WHERE class_id = ? AND academic_year_id = ?`,
        [classId, academicYearId]
    );
    return rows[0] || null;
}

// Every class a teacher has been the homeroom teacher for, most recent
// academic year first — mirrors enrollment.repository.js's findForStudent.
export async function findForTeacher(teacherId) {
    return await query(
        `
        SELECT
            class_teachers.*,
            classes.name AS class_name
        FROM class_teachers
        INNER JOIN classes ON classes.id = class_teachers.class_id
        WHERE class_teachers.teacher_id = ?
        ORDER BY class_teachers.academic_year_id DESC
        `,
        [teacherId]
    );
}

export async function updateTeacher(id, teacherId) {
    await query(`UPDATE class_teachers SET teacher_id = ? WHERE id = ?`, [teacherId, id]);
}

export async function setStatus(id, status) {
    await query(`UPDATE class_teachers SET status = ? WHERE id = ?`, [status, id]);
}
