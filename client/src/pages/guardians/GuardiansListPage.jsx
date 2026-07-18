import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GuardianForm from '../../components/guardians/GuardianForm';

function GuardiansListPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('guardians.write');

  const [guardians, setGuardians] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGuardian, setActiveGuardian] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [studentsByGuardian, setStudentsByGuardian] = useState({});

  const loadGuardians = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await api.get('/guardians', { params });
      setGuardians(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load guardians.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadGuardians();
  };

  const handleSaved = () => {
    setShowForm(false);
    setActiveGuardian(null);
    loadGuardians();
  };

  const handleArchive = async (guardian) => {
    try {
      await api.patch(`/guardians/${guardian.id}/archive`);
      loadGuardians();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not archive guardian.');
    }
  };

  const handleRestore = async (guardian) => {
    try {
      await api.patch(`/guardians/${guardian.id}/restore`);
      loadGuardians();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not restore guardian.');
    }
  };

  const toggleStudents = async (guardian) => {
    if (expandedId === guardian.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(guardian.id);
    if (!studentsByGuardian[guardian.id]) {
      try {
        const response = await api.get(`/guardians/${guardian.id}/students`);
        setStudentsByGuardian((current) => ({ ...current, [guardian.id]: response.data?.data || [] }));
      } catch {
        setStudentsByGuardian((current) => ({ ...current, [guardian.id]: [] }));
      }
    }
  };

  return (
    <main className="erp-shell">
      <section className="hero-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Students & Parents</p>
            <h1>Guardians</h1>
          </div>
          {canWrite ? (
            <button type="button" onClick={() => { setActiveGuardian(null); setShowForm(true); }}>
              Add guardian
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSearchSubmit} className="toolbar-row">
          <input
            placeholder="Search by name, phone, or email…"
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
          <GuardianForm guardian={activeGuardian} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        </section>
      ) : null}

      <section className="hero-card">
        {loading ? (
          <p>Loading guardians…</p>
        ) : guardians.length === 0 ? (
          <p>No guardians found.</p>
        ) : (
          <ul className="record-list">
            {guardians.map((guardian) => (
              <li key={guardian.id} className="record-item">
                <div className="list-row">
                  <div>
                    <strong>{guardian.first_name} {guardian.last_name}</strong>
                    <span className={`status-badge status-${guardian.status?.toLowerCase()}`}>{guardian.status}</span>
                    <p className="record-meta">
                      {guardian.phone || 'No phone'} · {guardian.email || 'No email'}
                    </p>
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => toggleStudents(guardian)}>
                      {expandedId === guardian.id ? 'Hide students' : 'View students'}
                    </button>
                    {canWrite ? (
                      <button type="button" className="secondary" onClick={() => { setActiveGuardian(guardian); setShowForm(true); }}>
                        Edit
                      </button>
                    ) : null}
                    {canWrite && guardian.status === 'ACTIVE' ? (
                      <button type="button" className="danger" onClick={() => handleArchive(guardian)}>Archive</button>
                    ) : null}
                    {canWrite && guardian.status === 'ARCHIVED' ? (
                      <button type="button" onClick={() => handleRestore(guardian)}>Restore</button>
                    ) : null}
                  </div>
                </div>
                {expandedId === guardian.id ? (
                  <div className="nested-panel">
                    {(studentsByGuardian[guardian.id] || []).length === 0 ? (
                      <p className="record-meta">No linked students.</p>
                    ) : (
                      <ul className="chip-list">
                        {studentsByGuardian[guardian.id].map((student) => (
                          <li key={student.id}>
                            <Link to={`/students/${student.id}`}>
                              {student.first_name} {student.last_name} ({student.admission_number})
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default GuardiansListPage;
