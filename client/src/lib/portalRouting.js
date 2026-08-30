// Where a freshly authenticated user should land — used by both LoginPage
// and AppRoutes' / and * redirects, so the two never drift out of sync.
// Student/Parent portal accounts hold nothing but portal.*.read (see
// permission.helper.js server-side), so they're routed straight to their
// own portal rather than /dashboard, which they don't have students.read
// for and would just get a 403 from.
export function getDefaultLandingPath(user) {
  const permissions = user?.permissions || [];

  if (permissions.includes('portal.student.read')) {
    return '/portal/student';
  }

  if (permissions.includes('portal.parent.read')) {
    return '/portal/parent';
  }

  return '/dashboard';
}
