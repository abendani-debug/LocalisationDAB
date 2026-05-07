import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDAB } from '../api/dabApi';
import DABDetail from '../components/DAB/DABDetail';
import Spinner from '../components/UI/Spinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import useSocket, { joinDABRoom, leaveDABRoom } from '../hooks/useSocket';

export default function DABDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [dab, setDab]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getDAB(id)
      .then((res) => setDab(res.data))
      .catch(() => setError(t('dab.not_found')))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (dab) {
      document.title = `${dab.nom} — MapsDab`;
    }
    return () => { document.title = 'MapsDab — Localisez votre DAB en Algérie'; };
  }, [dab]);

  useEffect(() => {
    joinDABRoom(id);
    return () => leaveDABRoom(id);
  }, [id]);

  const handleStatutChange = useCallback(({ etatCommunautaire }) => {
    setDab((prev) => prev ? { ...prev, etat_communautaire: etatCommunautaire } : prev);
  }, []);

  useSocket(null);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div>;
  if (error)   return <div style={{ padding: '2rem' }}><ErrorMessage message={error} onRetry={load} /></div>;

  return (
    <div>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '0.9rem' }}>
          {t('common.back')}
        </button>
      </div>
      <DABDetail dab={dab} onSignalement={(data) => {
        if (data?.etatCommunautaire) setDab((prev) => ({ ...prev, etat_communautaire: data.etatCommunautaire }));
      }} />
    </div>
  );
}
