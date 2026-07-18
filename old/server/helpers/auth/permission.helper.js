export const DEFAULT_ROLE_PERMISSIONS = {
    Administrator: ['users.read', 'users.write', 'roles.read', 'roles.write', 'academic-years.read', 'academic-years.write'],
    Teacher: ['academic-years.read'],
    Student: [],
    Parent: []
};

export const normalizePermissions = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return [];
};
