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

  const evolutionData = pivotEvolution(stats.evolution ?? []);
  const parEtat = stats.parEtat ?? [];
  const totalParEtat = parEtat.reduce((s, e) => s + e.total, 0);

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: 'sans-serif', padding: 24, boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stats.banque.nom}</h1>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>30 derniers jours</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {['disponible', 'vide', 'en_panne'].map((etat) => {
          const count = parEtat.find((e) => e.etat === etat)?.total || 0;
          const pct = totalParEtat > 0 ? Math.round((count / totalParEtat) * 100) : null;
          return (
            <div key={etat} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: ETAT_COLORS[etat] }}>
                {ETAT_LABELS[etat]}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#111827' }}>{count}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{pct !== null ? `${pct}%` : '—'}</p>
            </div>
          );
        })}
      </div>

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
      {(stats.topDabProblematiques ?? []).length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun signalement négatif sur cette période.</p>
      ) : (
        (stats.topDabProblematiques ?? []).map((d) => (
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
