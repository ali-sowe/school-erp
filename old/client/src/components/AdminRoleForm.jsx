import { useState } from 'react';
import api from '../services/api';

function AdminRoleForm({ role, onSaved, onCancel }) {
  const [form, setForm] = useState({
    role_name: role?.role_name || '',
    description: role?.description || ''
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
      if (role?.id) {
        await api.patch(`/roles/${role.id}`, form);
      } else {
        await api.post('/roles', form);
      }

      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save role.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel-form">
      <h3>{role?.id ? 'Edit role' : 'Create role'}</h3>
      {error ? <p className="error-text">{error}</p> : null}
      <label>
        Role name
        <input name="role_name" value={form.role_name} onChange={handleChange} required />
      </label>
      <label>
        Description
        <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default AdminRoleForm;
