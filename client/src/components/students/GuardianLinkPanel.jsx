import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import GuardianForm from '../guardians/GuardianForm';

function GuardianLinkPanel({ studentId, canWrite }) {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [linking, setLinking] = useState(false);
  const [showNewGuardianForm, setShowNewGuardianForm] = useState(false);

  const loadGuardians = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/students/${studentId}/guardians`);
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
  }, [studentId]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get('/guardians', { params: { search: searchTerm, status: 'ACTIVE' } });
      setSearchResults(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Guardian search failed.');
    }
  };

  const linkGuardian = async (guardianId) => {
    if (!guardianId || !relationship) {
      setError('Pick a guardian and enter their relationship to the student.');
      return;
    }
    setLinking(true);
    setError('');
    try {
      await api.post(`/students/${studentId}/guardians`, {
        guardian_id: guardianId,
        relationship,
        is_primary_contact: isPrimaryContact
      });
      setSearchTerm('');
      setSearchResults([]);
      setSelectedGuardianId('');
      setRelationship('');
      setIsPrimaryContact(false);
      setShowNewGuardianForm(false);
      loadGuardians();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not link guardian.');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkSelected = () => linkGuardian(selectedGuardianId);

  const handleNewGuardianSaved = (guardian) => linkGuardian(guardian.id);

  const handleUnlink = async (guardianId) => {
    try {
      await api.delete(`/students/${studentId}/guardians/${guardianId}`);
      loadGuardians();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not unlink guardian.');
    }
  };

  return (
    <section className="hero-card">
      <h2>Guardians</h2>
      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p>Loading guardians…</p>
      ) : guardians.length === 0 ? (
        <p className="record-meta">No guardians linked yet.</p>
      ) : (
        <ul className="record-list">
          {guardians.map((guardian) => (
            <li key={guardian.id} className="record-item">
              <div className="list-row">
                <div>
                  <Link to="/guardians">
                    <strong>{guardian.first_name} {guardian.last_name}</strong>
                  </Link>
                  {guardian.is_primary_contact ? <span className="status-badge status-active">Primary contact</span> : null}
                  <p className="record-meta">
                    {guardian.relationship} · {guardian.phone || 'No phone'}
                  </p>
                </div>
                {canWrite ? (
                  <div className="actions">
                    <button type="button" className="danger" onClick={() => handleUnlink(guardian.id)}>Unlink</button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <div className="nested-panel">
          <h3>Link a guardian</h3>
          <form onSubmit={handleSearch} className="toolbar-row">
            <input
              placeholder="Search guardians by name, phone, or email…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="submit" className="secondary">Search</button>
          </form>

          {searchResults.length > 0 ? (
            <label>
              Select a guardian
              <select value={selectedGuardianId} onChange={(event) => setSelectedGuardianId(event.target.value)}>
                <option value="">Choose…</option>
                {searchResults.map((guardian) => (
                  <option key={guardian.id} value={guardian.id}>
                    {guardian.first_name} {guardian.last_name} ({guardian.phone || guardian.email || 'no contact info'})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            Relationship to student
            <input
              placeholder="e.g. Mother, Father, Uncle, Guardian"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPrimaryContact}
              onChange={(event) => setIsPrimaryContact(event.target.checked)}
            />
            Primary contact
          </label>

          <div className="form-actions">
            <button type="button" onClick={handleLinkSelected} disabled={linking || !selectedGuardianId}>
              {linking ? 'Linking…' : 'Link selected guardian'}
            </button>
            <button type="button" className="secondary" onClick={() => setShowNewGuardianForm((current) => !current)}>
              {showNewGuardianForm ? 'Cancel new guardian' : 'Add a new guardian instead'}
            </button>
          </div>

          {showNewGuardianForm ? (
            <GuardianForm onSaved={handleNewGuardianSaved} onCancel={() => setShowNewGuardianForm(false)} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default GuardianLinkPanel;
