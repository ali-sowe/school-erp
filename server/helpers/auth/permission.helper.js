export const DEFAULT_ROLE_PERMISSIONS = {
    'Platform Administrator': ['schools.read', 'schools.write'],
    Administrator: [
        'users.read', 'users.write',
        'roles.read', 'roles.write',
        'academic-years.read', 'academic-years.write',
        'terms.read', 'terms.write',
        'grade-levels.read', 'grade-levels.write',
        'subjects.read', 'subjects.write',
        'classes.read', 'classes.write',
        'students.read', 'students.write',
        'guardians.read', 'guardians.write',
        'attendance.read', 'attendance.write',
        'teachers.read', 'teachers.write',
        'teacher-assignments.read', 'teacher-assignments.write',
        'finance.read', 'finance.write',
        'exams.read', 'exams.write',
        'messaging.read', 'messaging.write',
        'announcements.read', 'announcements.write',
        'notifications.read', 'notifications.write',
        'library.read', 'library.write',
        'approvals.read', 'approvals.write',
        'documents.read', 'documents.write',
        'data-imports.read', 'data-imports.write',
        'leave-requests.read', 'leave-requests.write',
        'reports.read',
        'expenses.read', 'expenses.write',
        'calendar.read', 'calendar.write'
    ],
    Teacher: [
        'academic-years.read', 'terms.read',
        'grade-levels.read', 'subjects.read', 'classes.read',
        'students.read', 'guardians.read',
        'attendance.read', 'attendance.write',
        'teacher-assignments.read',
        'exams.read', 'exams.write',
        'messaging.read', 'messaging.write',
        'announcements.read',
        'notifications.read', 'notifications.write',
        'library.read',
        'approvals.read', 'approvals.write',
        'documents.read',
        'leave-requests.read', 'leave-requests.write',
        'reports.read',
        'expenses.read', 'expenses.write',
        'calendar.read'
    ],
    // Deliberately NOT students.read/attendance.read/exams.read/etc — those
    // permission strings alone would let a Student or Parent account query
    // ANY record in the school through the existing staff endpoints, since
    // authorize() only checks the permission string is present, not whose
    // record is being asked for. portal.*.read is its own permission,
    // usable only through routes/portal/portal.routes.js, where every
    // handler resolves identity from req.user.userId server-side.
    Student: ['portal.student.read'],
    Parent: ['portal.parent.read']
};

export const normalizePermissions = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
};
