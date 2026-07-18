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
        'guardians.read', 'guardians.write'
    ],
    Teacher: [
        'academic-years.read', 'terms.read',
        'grade-levels.read', 'subjects.read', 'classes.read',
        'students.read', 'guardians.read'
    ],
    Student: [],
    Parent: []
};

export const normalizePermissions = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
};
