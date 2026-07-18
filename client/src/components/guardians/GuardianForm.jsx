import { useState } from 'react';
import api from '../../services/api';

function GuardianForm({ guardian, onSaved, onCancel }) {
  const [form, setForm] = useState({
    first_name: guardian?.first_name || '',
    last_name: guardian?.last_name || '',
    phone: guardian?.phone || '',
    email: guardian?.email || '',
    address: guardian?.address || '',
    occupation: guardian?.occupation || ''
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

    // Optional fields left blank shouldn't overwrite existing values with
    // empty strings on update, or fail email/phone validation on create.
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== '')
    );

    try {
      let response;
      if (guardian?.id) {
        response = await api.patch(`/guardians/${guardian.id}`, payload);
      } else {
        response = await api.post('/guardians', payload);
      }
      onSaved(response.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save guardian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel-form">
      <h3>{guardian?.id ? 'Edit guardian' : 'Add guardian'}</h3>
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
        Phone
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. +2203456789" />
      </label>
      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={handleChange} />
      </label>
      <label>
        Address
        <input name="address" value={form.address} onChange={handleChange} />
      </label>
      <label>
        Occupation
        <input name="occupation" value={form.occupation} onChange={handleChange} />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default GuardianForm;
