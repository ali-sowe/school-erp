import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

// The nav mirrors the "Version 1 Modules" build order from docs/readme.txt.
// Modules with no backend/frontend yet are listed but disabled, so the shell
// always shows the full roadmap rather than only what happens to exist today.
const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', permission: null, ready: true },
  { label: 'Students', to: '/students', permission: 'students.read', ready: true },
  { label: 'Guardians', to: '/guardians', permission: 'guardians.read', ready: true },
  { label: 'Classes', to: '/classes', permission: 'classes.read', ready: false },
  { label: 'Subjects', to: '/subjects', permission: 'subjects.read', ready: false },
  { label: 'Teachers', to: '/teachers', permission: null, ready: false },
  { label: 'Attendance', to: '/attendance', permission: null, ready: false },
  { label: 'Exams', to: '/exams', permission: null, ready: false },
  { label: 'Finance', to: '/finance', permission: null, ready: false },
  { label: 'Users & Roles', to: '/admin', permission: 'users.read', ready: true }
];

function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <div className="app-shell">
      <aside className="app-nav">
        <p className="eyebrow">School ERP</p>
        <nav>
          {visibleItems.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ) : (
              <span key={item.to} className="app-nav-link disabled" title="Coming soon">
                {item.label}
              </span>
            )
          )}
        </nav>
        <div className="app-nav-footer">
          <p className="app-nav-user">{user?.first_name} {user?.last_name}</p>
          <p className="app-nav-role">{user?.role_name}</p>
          <button type="button" className="secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
