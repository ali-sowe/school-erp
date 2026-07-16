import { useState } from 'react';
import api from '../services/api';

function AdminUserForm({ user, roles, onSaved, onCancel }) {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    password: '',
    role_id: user?.role_id || roles[0]?.id || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...form,
        password: form.password || undefined
      };

      if (user?.id) {
        await api.patch(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', payload);
      }

      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel-form">
      <h3>{user?.id ? 'Edit user' : 'Create user'}</h3>
      {error ? <p className="error-text">{error}</p> : null}
      <label>
        First name
        <input name="first_name" value={form.first_name} onChange={handleChange} required />
      </label>
      <label>
        Last name
        <input name="last_name" value={form.last_name} onChange={handleChange} required />
      </label>
      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>
        Password
        <input type="password" name="password" value={form.password} onChange={handleChange} placeholder={user?.id ? 'Leave blank to keep current' : ''} />
      </label>
      <label>
        Role
        <select name="role_id" value={form.role_id} onChange={handleChange} required>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </label>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AdminUserForm;
