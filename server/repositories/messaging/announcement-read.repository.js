import { query } from "../../database/query.js";

export async function markAsRead(announcementId, userId) {
    // A read is a fact, not something to overwrite — if it's already there,
    // do nothing rather than erroring on the unique constraint.
    await query(
        `INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)`,
        [announcementId, userId]
    );
}

export async function findReaders(announcementId) {
    return await query(
        `
        SELECT announcement_reads.read_at, users.id, users.first_name, users.last_name, users.email
        FROM announcement_reads
        INNER JOIN users ON users.id = announcement_reads.user_id
        WHERE announcement_reads.announcement_id = ?
        ORDER BY announcement_reads.read_at ASC
        `,
        [announcementId]
    );
}

// Students in scope for a given audience, joined with their guardians' basic
// contact info — this is what lets staff manually reach parents (phone
// call, SMS, printout) today, even though there's no in-app delivery to
// guardians yet.
export async function findStudentsForSchool(schoolId) {
    return await query(
        `SELECT id, first_name, last_name FROM students WHERE school_id = ? AND status = 'ACTIVE'`,
        [schoolId]
    );
}

export async function findStudentsForGradeLevel(schoolId, gradeLevelId) {
    return await query(
        `
        SELECT DISTINCT students.id, students.first_name, students.last_name
        FROM students
        INNER JOIN student_enrollments ON student_enrollments.student_id = students.id
        INNER JOIN classes ON classes.id = student_enrollments.class_id
        WHERE students.school_id = ?
        AND students.status = 'ACTIVE'
        AND student_enrollments.status = 'ACTIVE'
        AND classes.grade_level_id = ?
        `,
        [schoolId, gradeLevelId]
    );
}

export async function findStudentsForClass(schoolId, classId) {
    return await query(
        `
        SELECT DISTINCT students.id, students.first_name, students.last_name
        FROM students
        INNER JOIN student_enrollments ON student_enrollments.student_id = students.id
        WHERE students.school_id = ?
        AND students.status = 'ACTIVE'
        AND student_enrollments.status = 'ACTIVE'
        AND student_enrollments.class_id = ?
        `,
        [schoolId, classId]
    );
}

export async function findGuardiansForStudents(studentIds) {
    if (studentIds.length === 0) {
        return [];
    }

    const placeholders = studentIds.map(() => '?').join(', ');

    return await query(
        `
        SELECT DISTINCT
            guardians.id, guardians.first_name, guardians.last_name, guardians.phone, guardians.email
        FROM guardians
        INNER JOIN student_guardians ON student_guardians.guardian_id = guardians.id
        WHERE student_guardians.student_id IN (${placeholders})
        AND student_guardians.status = 'ACTIVE'
        AND guardians.status = 'ACTIVE'
        `,
        studentIds
    );
}
