import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const { user, hasPermission } = useAuth();

  return (
    <main className="erp-shell">
      <section className="hero-card">
        <p className="eyebrow">School ERP</p>
        <h1>Welcome back, {user?.first_name}</h1>
        <p>Signed in as {user?.role_name}. Pick a module to get started.</p>
      </section>

      <section className="feature-grid">
        {hasPermission('students.read') ? (
          <Link to="/students" className="feature-card feature-card-link">
            <h2>Students</h2>
            <p>Profiles, guardians, and enrollment history across academic years.</p>
          </Link>
        ) : null}
        {hasPermission('guardians.read') ? (
          <Link to="/guardians" className="feature-card feature-card-link">
            <h2>Guardians</h2>
            <p>Parent and guardian records, linked to one or more students.</p>
          </Link>
        ) : null}
        {hasPermission('users.read') ? (
          <Link to="/admin" className="feature-card feature-card-link">
            <h2>Users & Roles</h2>
            <p>Manage staff accounts and permission-based roles.</p>
          </Link>
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
