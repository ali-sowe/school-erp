import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentForm from '../../components/students/StudentForm';

function StudentsListPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('students.write');

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/students', { params });
      setStudents(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadStudents();
  };

  const handleSaved = () => {
    setShowForm(false);
    loadStudents();
  };

  const handleArchive = async (student) => {
    try {
      await api.patch(`/students/${student.id}/archive`);
      loadStudents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not archive student.');
    }
  };

  const handleRestore = async (student) => {
    try {
      await api.patch(`/students/${student.id}/restore`);
      loadStudents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not restore student.');
    }
  };

  return (
    <main className="erp-shell">
      <section className="hero-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Students & Parents</p>
            <h1>Students</h1>
          </div>
          {canWrite ? (
            <button type="button" onClick={() => setShowForm(true)}>Enrol new student</button>
          ) : null}
        </div>

        <form onSubmit={handleSearchSubmit} className="toolbar-row">
          <input
            placeholder="Search by name or admission number…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" className="secondary">Search</button>
        </form>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      {showForm ? (
        <section className="hero-card">
          <StudentForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        </section>
      ) : null}

      <section className="hero-card">
        {loading ? (
          <p>Loading students…</p>
        ) : students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <ul className="record-list">
            {students.map((student) => (
              <li key={student.id} className="record-item">
                <div className="list-row">
                  <div>
                    <Link to={`/students/${student.id}`}>
                      <strong>{student.first_name} {student.last_name}</strong>
                    </Link>
                    <span className={`status-badge status-${student.status?.toLowerCase()}`}>{student.status}</span>
                    <p className="record-meta">
                      {student.admission_number} · {student.gender || 'Gender not set'}
                    </p>
                  </div>
                  <div className="actions">
                    <Link to={`/students/${student.id}`}>
                      <button type="button" className="secondary">View</button>
                    </Link>
                    {canWrite && student.status === 'ACTIVE' ? (
                      <button type="button" className="danger" onClick={() => handleArchive(student)}>Archive</button>
                    ) : null}
                    {canWrite && student.status === 'ARCHIVED' ? (
                      <button type="button" onClick={() => handleRestore(student)}>Restore</button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default StudentsListPage;
