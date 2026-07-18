import { useEffect, useState } from 'react';
import api from '../../services/api';

function StudentAttendancePanel({ studentId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/students/${studentId}/attendance`, {
        params: { from: from || undefined, to: to || undefined }
      });
      setHistory(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load attendance history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleFilter = (event) => {
    event.preventDefault();
    loadHistory();
  };

  return (
    <section className="hero-card">
      <div className="card-header">
        <h2>Attendance history</h2>
      </div>

      <form onSubmit={handleFilter} className="toolbar-row">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} placeholder="From" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} placeholder="To" />
        <button type="submit" className="secondary">Filter</button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p>Loading attendance history…</p>
      ) : history.length === 0 ? (
        <p className="record-meta">No attendance recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{record.attendance_date?.slice(0, 10)}</td>
                <td><span className={`status-badge status-${record.status?.toLowerCase()}`}>{record.status}</span></td>
                <td>{record.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default StudentAttendancePanel;
