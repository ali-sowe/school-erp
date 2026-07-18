import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StudentForm from '../../components/students/StudentForm';
import GuardianLinkPanel from '../../components/students/GuardianLinkPanel';
import EnrollmentPanel from '../../components/students/EnrollmentPanel';
import StudentAttendancePanel from '../../components/attendance/StudentAttendancePanel';

function StudentDetailPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('students.write');
  const canViewAttendance = hasPermission('attendance.read');

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const loadStudent = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load student.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaved = (updatedStudent) => {
    setStudent(updatedStudent);
    setEditing(false);
  };

  if (loading) {
    return (
      <main className="erp-shell">
        <p>Loading student…</p>
      </main>
    );
  }

  if (error && !student) {
    return (
      <main className="erp-shell">
        <p className="error-text">{error}</p>
        <Link to="/students">Back to students</Link>
      </main>
    );
  }

  return (
    <main className="erp-shell">
      <Link to="/students" className="back-link">← Back to students</Link>

      <section className="hero-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">{student.admission_number}</p>
            <h1>{student.first_name} {student.last_name}</h1>
          </div>
          <div className="actions">
            <span className={`status-badge status-${student.status?.toLowerCase()}`}>{student.status}</span>
            {canWrite && student.status !== 'ARCHIVED' ? (
              <button type="button" className="secondary" onClick={() => setEditing((current) => !current)}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {editing ? (
          <StudentForm student={student} onSaved={handleSaved} onCancel={() => setEditing(false)} />
        ) : (
          <dl className="detail-grid">
            <div>
              <dt>Gender</dt>
              <dd>{student.gender || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{student.date_of_birth ? student.date_of_birth.slice(0, 10) : 'Not specified'}</dd>
            </div>
            <div>
              <dt>Admission date</dt>
              <dd>{student.admission_date ? student.admission_date.slice(0, 10) : '—'}</dd>
            </div>
          </dl>
        )}
      </section>

      <GuardianLinkPanel studentId={student.id} canWrite={canWrite} />
      <EnrollmentPanel studentId={student.id} canWrite={canWrite} />
      {canViewAttendance ? <StudentAttendancePanel studentId={student.id} /> : null}
    </main>
  );
}

export default StudentDetailPage;
