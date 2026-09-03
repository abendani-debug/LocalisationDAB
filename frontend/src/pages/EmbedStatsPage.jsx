// frontend/src/pages/EmbedStatsPage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ETAT_COLORS = { disponible: '#16a34a', vide: '#dc2626', en_panne: '#f59e0b' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne' };

function pivotEvolution(rows) {
  const byJour = {};
  rows.forEach(({ jour, etat, total }) => {
    const key = jour.slice(0, 10);
    if (!byJour[key]) byJour[key] = { jour: key, disponible: 0, vide: 0, en_panne: 0 };
    byJour[key][etat] = total;
  });
  return Object.values(byJour).sort((a, b) => a.jour.localeCompare(b.jour));
}

export default function EmbedStatsPage() {
  const { token } = useParams();
  const [stats, setStats]     = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/embed/${token}/stats?period=30`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setError('Token invalide ou expiré.'); return; }
        setStats(json.data);
      })
      .catch(() => setError('Token invalide ou expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
      Chargement…
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#dc2626' }}>
      {error}
    </div>
  );

  const evolutionData = pivotEvolution(stats.evolution);
  const totalNegatif = stats.parEtat
    .filter((e) => e.etat === 'vide' || e.etat === 'en_panne')
    .reduce((sum, e) => sum + e.total, 0);
  const totalDisponible = stats.parEtat.find((e) => e.etat === 'disponible')?.total || 0;
  const total = totalDisponible + totalNegatif;
  const tauxDispo = total > 0 ? Math.round((totalDisponible / total) * 1000) / 10 : null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: 'sans-serif', padding: 24, boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stats.banque.nom}</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
        Taux de disponibilité (30 derniers jours) :{' '}
        <strong style={{ color: tauxDispo === null ? '#6b7280' : tauxDispo >= 70 ? '#16a34a' : tauxDispo >= 40 ? '#f59e0b' : '#dc2626' }}>
          {tauxDispo !== null ? `${tauxDispo}%` : '—'}
        </strong>
      </p>

      <div style={{ height: 260, marginBottom: 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend formatter={(key) => ETAT_LABELS[key] || key} />
            {Object.keys(ETAT_COLORS).map((etat) => (
              <Line key={etat} type="monotone" dataKey={etat} stroke={ETAT_COLORS[etat]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 12 }}>
        Distributeurs les plus signalés vide/en panne
      </h2>
      {stats.topDabProblematiques.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun signalement négatif sur cette période.</p>
      ) : (
        stats.topDabProblematiques.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{d.nom}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{d.adresse}</p>
            </div>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>{d.total_negatif}</span>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        Propulsé par{' '}
        <a href="https://mapsdab.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          MapsDab
        </a>
      </div>
    </div>
  );
}
