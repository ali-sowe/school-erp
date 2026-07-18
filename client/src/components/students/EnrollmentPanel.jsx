import { useEffect, useState } from 'react';
import api from '../../services/api';

// student_enrollments only stores class_id/academic_year_id, so this panel
// fetches classes/academic years once and resolves names client-side rather
// than adding a join the repository doesn't already do.
function EnrollmentPanel({ studentId, canWrite }) {
  const [history, setHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [classId, setClassId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [enrolledDate, setEnrolledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [transferTargets, setTransferTargets] = useState({});
  const [withdrawReasons, setWithdrawReasons] = useState({});

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [historyRes, classesRes, yearsRes] = await Promise.all([
        api.get(`/students/${studentId}/enrollments`),
        api.get('/classes'),
        api.get('/academic-years')
      ]);
      setHistory(historyRes.data?.data || []);
      setClasses(classesRes.data?.data || []);
      setAcademicYears(yearsRes.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load enrollment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const classNameFor = (id) => classes.find((item) => item.id === id)?.name || `Class #${id}`;
  const yearNameFor = (id) => academicYears.find((item) => item.id === id)?.name || `Year #${id}`;

  const handleEnroll = async (event) => {
    event.preventDefault();
    if (!classId) {
      setError('Choose a class to enrol the student into.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { class_id: classId };
      if (academicYearId) payload.academic_year_id = academicYearId;
      if (enrolledDate) payload.enrolled_date = enrolledDate;
      await api.post(`/students/${studentId}/enrollments`, payload);
      setShowEnrollForm(false);
      setClassId('');
      setAcademicYearId('');
      setEnrolledDate('');
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not enrol student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (enrollmentId) => {
    const newClassId = transferTargets[enrollmentId];
    if (!newClassId) {
      setError('Choose a class to transfer into.');
      return;
    }
    try {
      await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/transfer`, { class_id: newClassId });
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not transfer student.');
    }
  };

  const handleWithdraw = async (enrollmentId) => {
    try {
      await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/withdraw`, {
        reason: withdrawReasons[enrollmentId] || undefined
      });
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not withdraw student.');
    }
  };

  const handleComplete = async (enrollmentId) => {
    try {
      await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/complete`);
      loadAll();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not complete enrollment.');
    }
  };

  return (
    <section className="hero-card">
      <div className="card-header">
        <h2>Enrollment history</h2>
        {canWrite ? (
          <button type="button" onClick={() => setShowEnrollForm((current) => !current)}>
            {showEnrollForm ? 'Cancel' : 'Enrol into a class'}
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {showEnrollForm ? (
        <form onSubmit={handleEnroll} className="panel-form nested-panel">
          <label>
            Class
            <select value={classId} onChange={(event) => setClassId(event.target.value)} required>
              <option value="">Choose a class…</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
              ))}
            </select>
          </label>
          <label>
            Academic year
            <select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}>
              <option value="">Use the active academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </label>
          <label>
            Enrolled date
            <input type="date" value={enrolledDate} onChange={(event) => setEnrolledDate(event.target.value)} placeholder="Defaults to today" />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={submitting}>{submitting ? 'Enrolling…' : 'Enrol'}</button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p>Loading enrollment history…</p>
      ) : history.length === 0 ? (
        <p className="record-meta">No enrollment history yet.</p>
      ) : (
        <ul className="record-list">
          {history.map((enrollment) => (
            <li key={enrollment.id} className="record-item">
              <div className="list-row">
                <div>
                  <strong>{yearNameFor(enrollment.academic_year_id)}</strong>
                  <span className={`status-badge status-${enrollment.status?.toLowerCase()}`}>{enrollment.status}</span>
                  <p className="record-meta">
                    {classNameFor(enrollment.class_id)} · enrolled {enrollment.enrolled_date}
                    {enrollment.reason ? ` · ${enrollment.reason}` : ''}
                  </p>
                </div>
              </div>

              {canWrite && enrollment.status === 'ACTIVE' ? (
                <div className="nested-panel enrollment-actions">
                  <label>
                    Transfer to
                    <select
                      value={transferTargets[enrollment.id] || ''}
                      onChange={(event) => setTransferTargets((current) => ({ ...current, [enrollment.id]: event.target.value }))}
                    >
                      <option value="">Choose a class…</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => handleTransfer(enrollment.id)}>Transfer</button>
                    <button type="button" onClick={() => handleComplete(enrollment.id)}>Mark completed</button>
                  </div>
                  <label>
                    Withdrawal reason (optional)
                    <input
                      value={withdrawReasons[enrollment.id] || ''}
                      onChange={(event) => setWithdrawReasons((current) => ({ ...current, [enrollment.id]: event.target.value }))}
                    />
                  </label>
                  <div className="actions">
                    <button type="button" className="danger" onClick={() => handleWithdraw(enrollment.id)}>Withdraw</button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default EnrollmentPanel;
