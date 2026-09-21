// frontend/src/pages/EmbedStatsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import TopDabProblematiques from '../components/Stats/TopDabProblematiques';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const LIVE_REFRESH_MS = 45000;

const ETAT_COLORS = { disponible: '#16a34a', vide: '#f59e0b', en_panne: '#dc2626', non_renseigne: '#94a3b8' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne', non_renseigne: 'Non renseigné' };
const ETAT_ORDER  = { en_panne: 0, vide: 1, disponible: 2, non_renseigne: 3 };

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return `il y a ${Math.floor(diffH / 24)} j`;
}

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
  const [stats, setStats]           = useState(null);
  const [dabs, setDabs]             = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError]           = useState(null);
  const [loading, setLoading]       = useState(true);

  const loadDabs = useCallback(() => {
    fetch(`${API_URL}/embed/${token}/dabs`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setDabs(json.data.dabs);
          setLastRefresh(new Date());
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetch(`${API_URL}/embed/${token}/stats?period=30`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setError('Token invalide ou expiré.'); return; }
        setStats(json.data);
      })
      .catch(() => setError('Token invalide ou expiré.'))
      .finally(() => setLoading(false));
    loadDabs();
  }, [token, loadDabs]);

  useEffect(() => {
    const interval = setInterval(loadDabs, LIVE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadDabs]);

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

  const liveCounts = { disponible: 0, vide: 0, en_panne: 0, non_renseigne: 0 };
  dabs.forEach((d) => { liveCounts[d.etat_communautaire || 'non_renseigne'] += 1; });
  const dabsLive = [...dabs].sort((a, b) => {
    const oa = ETAT_ORDER[a.etat_communautaire || 'non_renseigne'];
    const ob = ETAT_ORDER[b.etat_communautaire || 'non_renseigne'];
    return oa !== ob ? oa - ob : a.nom.localeCompare(b.nom);
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: 'sans-serif', padding: 24, boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stats.banque.nom}</h1>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Vue d'ensemble de votre parc de distributeurs</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', margin: 0 }}>
          État actuel de vos distributeurs
        </h2>
        {lastRefresh && (
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>
            Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {['disponible', 'vide', 'en_panne', 'non_renseigne'].map((etat) => (
          <div key={etat} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: ETAT_COLORS[etat] }}>
              {ETAT_LABELS[etat]}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#111827' }}>{liveCounts[etat]}</p>
          </div>
        ))}
      </div>

      {dabsLive.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 32 }}>Aucun distributeur actif pour le moment.</p>
      ) : (
        <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
          {dabsLive.map((d, i) => {
            const etat = d.etat_communautaire || 'non_renseigne';
            return (
              <div
                key={d.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderBottom: i < dabsLive.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{d.nom}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{d.adresse}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px',
                    borderRadius: 999, color: '#fff', background: ETAT_COLORS[etat],
                  }}>
                    {ETAT_LABELS[etat]}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: '#cbd5e1' }}>{timeAgo(d.etat_communautaire_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 12 }}>
        Historique — 30 derniers jours
      </h2>

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

      <TopDabProblematiques
        title="Distributeurs les plus signalés vide/en panne"
        items={stats.topDabProblematiques ?? []}
      />

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        Propulsé par{' '}
        <a href="https://mapsdab.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          MapsDab
        </a>
      </div>
    </div>
  );
}
