import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { updateDAB, deleteDAB } from '../../api/dabApi';

export default function AdminQuickEditModal({ dab, onClose, onRefresh }) {
  const [nom, setNom]                   = useState(dab.nom ?? '');
  const [banques, setBanques]           = useState([]);
  const [banqueId, setBanqueId]         = useState(dab.banque_id ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    api.get('/banques').then((r) => setBanques(r.data.data || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    const trimmedNom = nom.trim();
    if (!trimmedNom) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDAB(dab.id, {
        nom: trimmedNom,
        banque_id: banqueId !== '' ? parseInt(banqueId, 10) : null,
      });
      onRefresh();
      onClose();
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      await deleteDAB(dab.id);
      onRefresh();
      onClose();
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '14px', padding: '1.25rem',
          width: '100%', maxWidth: '360px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              background: '#fef3c7', color: '#92400e',
              fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem',
            }}>
              ADMIN
            </span>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: '#111827' }}>
              Modération rapide
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.9rem', color: '#6b7280' }}
          >
            ✕
          </button>
        </div>

        {/* Nom du DAB */}
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.3rem' }}>
          Nom du distributeur
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          maxLength={255}
          style={{
            width: '100%', padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.83rem', marginBottom: '1rem',
            background: '#fff', color: '#111827', fontWeight: 600,
            boxSizing: 'border-box',
          }}
        />

        {/* Sélection banque */}
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.3rem' }}>
          Banque associée
        </label>
        <select
          value={banqueId}
          onChange={(e) => setBanqueId(e.target.value)}
          style={{
            width: '100%', padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.85rem', marginBottom: '1rem',
            background: '#fff', color: '#111827',
          }}
        >
          <option value="">— Aucune (ATM générique) —</option>
          {banques.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </select>

        {error && (
          <p style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '0.75rem' }}>{error}</p>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '0.6rem',
              background: '#2563eb', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving && !confirmDelete ? '...' : 'Sauvegarder'}
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              style={{
                padding: '0.6rem 0.9rem',
                background: '#fee2e2', color: '#dc2626',
                border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              🗑️
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '0.6rem 0.75rem',
                background: '#dc2626', color: '#fff',
                border: 'none', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '...' : 'Confirmer 🗑️'}
            </button>
          )}
        </div>

        {confirmDelete && !saving && (
          <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem', textAlign: 'center' }}>
            Cette action est irréversible.{' '}
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
            >
              Annuler
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
