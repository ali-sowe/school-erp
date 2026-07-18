import { useState } from 'react';
import api from '../../services/api';

// admission_number and admission_date only apply on create — the backend's
// updateStudentSchema deliberately doesn't accept them (admission history
// shouldn't be rewritten after the fact).
function StudentForm({ student, onSaved, onCancel }) {
  const [form, setForm] = useState({
    admission_number: '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    gender: student?.gender || '',
    date_of_birth: student?.date_of_birth ? student.date_of_birth.slice(0, 10) : '',
    admission_date: ''
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
      let response;
      if (student?.id) {
        const payload = Object.fromEntries(
          Object.entries({
            first_name: form.first_name,
            last_name: form.last_name,
            gender: form.gender,
            date_of_birth: form.date_of_birth
          }).filter(([, value]) => value !== '')
        );
        response = await api.patch(`/students/${student.id}`, payload);
      } else {
        const payload = Object.fromEntries(
          Object.entries(form).filter(([, value]) => value !== '')
        );
        response = await api.post('/students', payload);
      }
      onSaved(response.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel-form">
      <h3>{student?.id ? 'Edit student' : 'Enrol new student'}</h3>
      {error ? <p className="error-text">{error}</p> : null}
      {!student?.id ? (
        <label>
          Admission number
          <input
            name="admission_number"
            value={form.admission_number}
            onChange={handleChange}
            placeholder="Leave blank to auto-generate"
          />
        </label>
      ) : null}
      <label>
        First name
        <input name="first_name" value={form.first_name} onChange={handleChange} required />
      </label>
      <label>
        Last name
        <input name="last_name" value={form.last_name} onChange={handleChange} required />
      </label>
      <label>
        Gender
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Not specified</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>
      <label>
        Date of birth
        <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
      </label>
      {!student?.id ? (
        <label>
          Admission date
          <input
            type="date"
            name="admission_date"
            value={form.admission_date}
            onChange={handleChange}
            placeholder="Defaults to today"
          />
        </label>
      ) : null}
      <div className="form-actions">
        <button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default StudentForm;
