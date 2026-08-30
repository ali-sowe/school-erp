// Mirrors server/helpers/auth/permission.helper.js's DEFAULT_ROLE_PERMISSIONS
// permission strings exactly — grouped here purely for the checkbox UI
// (Administrator's list there is the full/maximal set this covers).
// Student/Parent's portal.*.read permissions are deliberately excluded —
// those are granted through account type at creation, not editable here.
export const PERMISSION_GROUPS = [
  {
    key: 'academics',
    resources: ['academic-years', 'terms', 'grade-levels', 'subjects', 'classes'],
  },
  {
    key: 'studentsAndGuardians',
    resources: ['students', 'guardians'],
  },
  {
    key: 'attendance',
    resources: ['attendance'],
  },
  {
    key: 'teachers',
    resources: ['teachers', 'teacher-assignments'],
  },
  {
    key: 'exams',
    resources: ['exams'],
  },
  {
    key: 'finance',
    resources: ['finance', 'expenses'],
  },
  {
    key: 'library',
    resources: ['library'],
  },
  {
    key: 'communication',
    resources: ['messaging', 'announcements', 'notifications'],
  },
  {
    key: 'workflow',
    resources: ['approvals', 'leave-requests'],
  },
  {
    key: 'documents',
    resources: ['documents', 'data-imports', 'reports'],
  },
  {
    key: 'calendar',
    resources: ['calendar'],
  },
  {
    key: 'administration',
    resources: ['users', 'roles'],
  },
];

// resources with only a .read permission (no corresponding .write action
// exists on the backend for them) — reports is generate-only, for instance.
const READ_ONLY_RESOURCES = new Set(['reports']);

export function permissionsForResource(resource) {
  return READ_ONLY_RESOURCES.has(resource)
    ? [`${resource}.read`]
    : [`${resource}.read`, `${resource}.write`];
}
