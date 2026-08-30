import { query } from "../../database/query.js";

// Accepts an optional transaction connection so a class's whole day can be
// marked atomically (see attendance.service.js#markAttendance) — mirrors
// role.repository.js#create.
export async function create(data, connection = null) {
    const sql = `
        INSERT INTO attendance_records
        (
            school_id,
            student_id,
            class_id,
            academic_year_id,
            attendance_date,
            status,
            remarks,
            recorded_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        data.school_id,
        data.student_id,
        data.class_id,
        data.academic_year_id,
        data.attendance_date,
        data.status,
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

export async function findById(id) {
    const rows = await query(`SELECT * FROM attendance_records WHERE id = ?`, [id]);
    return rows[0] || null;
}

export async function findByStudentAndDate(studentId, attendanceDate) {
    const rows = await query(
        `SELECT * FROM attendance_records WHERE student_id = ? AND attendance_date = ?`,
        [studentId, attendanceDate]
    );
    return rows[0] || null;
}

export async function update(id, data, connection = null) {
    const fields = [];
    const values = [];

    if (data.status !== undefined) {
        fields.push('status = ?');
        values.push(data.status);
    }

    if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks);
    }

    if (fields.length === 0) {
        return;
    }

    values.push(id);
    const sql = `UPDATE attendance_records SET ${fields.join(', ')} WHERE id = ?`;

    if (connection) {
        await connection.query(sql, values);
        return;
    }

    await query(sql, values);
}

// Every enrolled student for the class/year, left-joined with that day's
// attendance record so the caller can see who hasn't been marked yet
// (attendance columns come back NULL for those rows) rather than only
// seeing students who already have a record.
export async function findRosterWithAttendance(classId, academicYearId, attendanceDate) {
    return await query(
        `
        SELECT
            student_enrollments.id AS enrollment_id,
            students.id AS student_id,
            students.first_name,
            students.last_name,
            students.admission_number,
            attendance_records.id AS attendance_id,
            attendance_records.status,
            attendance_records.remarks,
            attendance_records.recorded_by
        FROM student_enrollments
        INNER JOIN students ON students.id = student_enrollments.student_id
        LEFT JOIN attendance_records
            ON attendance_records.student_id = student_enrollments.student_id
            AND attendance_records.attendance_date = ?
        WHERE student_enrollments.class_id = ?
            AND student_enrollments.academic_year_id = ?
            AND student_enrollments.status = 'ACTIVE'
        ORDER BY students.last_name ASC, students.first_name ASC
        `,
        [attendanceDate, classId, academicYearId]
    );
}

// School-wide listing, optionally filtered by class/student/date range —
// same conditions-array style as findForStudent/getClassSummary, just not
// pre-scoped to one class or student. Added for the attendance report
// dataset (see services/report/datasets/attendance.dataset.js), which
// needs "the whole school's attendance for this range", not one student's
// or one class's.
export async function findAll(schoolId, { classId, studentId, from, to, status } = {}) {
    const conditions = ['school_id = ?'];
    const values = [schoolId];

    if (classId) {
        conditions.push('class_id = ?');
        values.push(classId);
    }

    if (studentId) {
        conditions.push('student_id = ?');
        values.push(studentId);
    }

    if (from) {
        conditions.push('attendance_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('attendance_date <= ?');
        values.push(to);
    }

    if (status) {
        conditions.push('status = ?');
        values.push(status);
    }

    return await query(
        `SELECT * FROM attendance_records WHERE ${conditions.join(' AND ')} ORDER BY attendance_date DESC`,
        values
    );
}

// A student's attendance history, optionally bounded by a date range. Most
// recent first, since that's what a teacher/parent looking at a student's
// record usually wants to see.
export async function findForStudent(studentId, { from, to } = {}) {
    const conditions = ['student_id = ?'];
    const values = [studentId];

    if (from) {
        conditions.push('attendance_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('attendance_date <= ?');
        values.push(to);
    }

    return await query(
        `SELECT * FROM attendance_records WHERE ${conditions.join(' AND ')} ORDER BY attendance_date DESC`,
        values
    );
}

// Per-status counts for the whole school on a single day — same shape as
// getClassSummary, just scoped to school_id/one date instead of one class
// over a range. Used by the dashboard's "today's attendance rate" stat.
export async function getSchoolSummaryForDate(schoolId, attendanceDate) {
    return await query(
        `
        SELECT status, COUNT(*) AS total
        FROM attendance_records
        WHERE school_id = ? AND attendance_date = ?
        GROUP BY status
        `,
        [schoolId, attendanceDate]
    );
}

// Per-status counts for a class over a date range — the shape a summary
// report/dashboard needs, without pulling every individual row.
export async function getClassSummary(classId, { from, to } = {}) {
    const conditions = ['class_id = ?'];
    const values = [classId];

    if (from) {
        conditions.push('attendance_date >= ?');
        values.push(from);
    }

    if (to) {
        conditions.push('attendance_date <= ?');
        values.push(to);
    }

    return await query(
        `
        SELECT status, COUNT(*) AS total
        FROM attendance_records
        WHERE ${conditions.join(' AND ')}
        GROUP BY status
        `,
        values
    );
}
