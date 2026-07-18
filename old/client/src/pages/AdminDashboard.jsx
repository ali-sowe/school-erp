import { useEffect, useState } from 'react';
import api from '../services/api';
import AdminUserForm from '../components/AdminUserForm';
import AdminRoleForm from '../components/AdminRoleForm';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles')
      ]);
      setUsers(usersRes.data?.data || []);
      setRoles(rolesRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUserSaved = async () => {
    setShowUserForm(false);
    setActiveUser(null);
    await loadData();
  };

  const handleRoleSaved = async () => {
    setShowRoleForm(false);
    setActiveRole(null);
    await loadData();
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete user.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await api.delete(`/roles/${roleId}`);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete role.');
    }
  };

  if (loading) return <p>Loading admin dashboard…</p>;

  return (
    <div className="erp-shell">
      <section className="hero-card">
        <p className="eyebrow">Admin Console</p>
        <h1>Manage users and access roles</h1>
        <p>Track account status, role assignments, and permission scopes from one place.</p>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="feature-grid">
        <article className="feature-card">
          <div className="card-header">
            <h2>Users</h2>
            <button onClick={() => { setActiveUser(null); setShowUserForm(true); }}>Add user</button>
          </div>
          {showUserForm ? (
            <AdminUserForm
              user={activeUser}
              roles={roles}
              onSaved={handleUserSaved}
              onCancel={() => { setShowUserForm(false); setActiveUser(null); }}
            />
          ) : (
            <ul>
              {users.map((user) => (
                <li key={user.id} className="list-row">
                  <span>{user.first_name} {user.last_name} • {user.email}</span>
                  <div className="actions">
                    <button className="secondary" onClick={() => { setActiveUser(user); setShowUserForm(true); }}>Edit</button>
                    <button className="danger" onClick={() => handleDeleteUser(user.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="feature-card">
          <div className="card-header">
            <h2>Roles</h2>
            <button onClick={() => { setActiveRole(null); setShowRoleForm(true); }}>Add role</button>
          </div>
          {showRoleForm ? (
            <AdminRoleForm
              role={activeRole}
              onSaved={handleRoleSaved}
              onCancel={() => { setShowRoleForm(false); setActiveRole(null); }}
            />
          ) : (
            <ul>
              {roles.map((role) => (
                <li key={role.id} className="list-row">
                  <span>{role.role_name}</span>
                  <div className="actions">
                    <button className="secondary" onClick={() => { setActiveRole(role); setShowRoleForm(true); }}>Edit</button>
                    <button className="danger" onClick={() => handleDeleteRole(role.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
