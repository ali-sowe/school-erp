import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function AttendancePage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('attendance.write');

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayIso());

  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [summaryFrom, setSummaryFrom] = useState('');
  const [summaryTo, setSummaryTo] = useState(todayIso());
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    // Only active classes can take attendance (the API rejects an
    // archived class outright), so there's no point offering them here.
    api.get('/classes', { params: { status: 'ACTIVE' } })
      .then((response) => setClasses(response.data?.data || []))
      .catch((err) => setError(err?.response?.data?.message || 'Unable to load classes.'));
  }, []);

  const loadRoster = async () => {
    if (!classId || !date) return;
    setLoadingRoster(true);
    setError('');
    setMessage('');
    try {
      const response = await api.get(`/classes/${classId}/attendance`, { params: { date } });
      setRoster(
        (response.data?.data || []).map((row) => ({
          ...row,
          status: row.status || 'PRESENT',
          remarks: row.remarks || ''
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load the roster for this class and date.');
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  const updateRow = (studentId, field, value) => {
    setRoster((current) =>
      current.map((row) => (row.student_id === studentId ? { ...row, [field]: value } : row))
    );
  };

  const markAllPresent = () => {
    setRoster((current) => current.map((row) => ({ ...row, status: 'PRESENT' })));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const entries = roster.map((row) => ({
        student_id: row.student_id,
        status: row.status,
        remarks: row.remarks || undefined
      }));
      await api.post(`/classes/${classId}/attendance`, { date, entries });
      setMessage('Attendance saved.');
      loadRoster();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const loadSummary = async () => {
    if (!classId) return;
    setSummaryError('');
    try {
      const response = await api.get(`/classes/${classId}/attendance/summary`, {
        params: { from: summaryFrom || undefined, to: summaryTo || undefined }
      });
      setSummary(response.data?.data || null);
    } catch (err) {
      setSummaryError(err?.response?.data?.message || 'Unable to load the attendance summary.');
      setSummary(null);
    }
  };

  return (
    <main className="erp-shell">
      <section className="hero-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Attendance</p>
            <h1>Daily register</h1>
          </div>
        </div>

        <div className="toolbar-row">
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">Choose a class…</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} max={todayIso()} />
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}
      {message ? <p className="record-meta">{message}</p> : null}

      {!classId ? null : (
        <section className="hero-card">
          {loadingRoster ? (
            <p>Loading roster…</p>
          ) : roster.length === 0 ? (
            <p>No students are actively enrolled in this class for the resolved academic year.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="card-header">
                <h2>Roster for {date}</h2>
                {canWrite ? (
                  <button type="button" className="secondary" onClick={markAllPresent}>Mark all present</button>
                ) : null}
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission #</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((row) => (
                    <tr key={row.student_id}>
                      <td>{row.first_name} {row.last_name}</td>
                      <td>{row.admission_number}</td>
                      <td>
                        {canWrite ? (
                          <select
                            value={row.status}
                            onChange={(event) => updateRow(row.student_id, 'status', event.target.value)}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`status-badge status-${row.status.toLowerCase()}`}>{row.status}</span>
                        )}
                      </td>
                      <td>
                        {canWrite ? (
                          <input
                            value={row.remarks}
                            onChange={(event) => updateRow(row.student_id, 'remarks', event.target.value)}
                            placeholder="Optional"
                          />
                        ) : (
                          row.remarks || '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {canWrite ? (
                <div className="form-actions">
                  <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save attendance'}</button>
                </div>
              ) : null}
            </form>
          )}
        </section>
      )}

      {!classId ? null : (
        <section className="hero-card">
          <h2>Summary</h2>
          <div className="toolbar-row">
            <input type="date" value={summaryFrom} onChange={(event) => setSummaryFrom(event.target.value)} placeholder="From" />
            <input type="date" value={summaryTo} onChange={(event) => setSummaryTo(event.target.value)} placeholder="To" />
            <button type="button" className="secondary" onClick={loadSummary}>Load summary</button>
          </div>

          {summaryError ? <p className="error-text">{summaryError}</p> : null}

          {summary ? (
            <div className="summary-grid">
              {STATUSES.map((status) => (
                <div key={status} className="summary-stat">
                  <strong>{summary[status] ?? 0}</strong>
                  <span>{status}</span>
                </div>
              ))}
              <div className="summary-stat">
                <strong>{summary.TOTAL ?? 0}</strong>
                <span>Total</span>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default AttendancePage;
