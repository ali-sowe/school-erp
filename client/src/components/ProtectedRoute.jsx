import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

// Gates a route on two things: is there a logged-in user at all, and (if a
// permission was requested) does that user's role actually have it. This
// mirrors the backend's authenticate + authorize pair so the UI never shows
// a screen the API would refuse to serve.
function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="erp-shell">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="erp-shell">
        <section className="hero-card">
          <p className="eyebrow">Access denied</p>
          <h1>You don't have permission to view this page</h1>
          <p>Ask an administrator for access if you believe this is a mistake.</p>
        </section>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
