// frontend/src/pages/admin/AdminStatsBanques.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PERIODS = [
  { value: '7',   label: '7 jours' },
  { value: '30',  label: '30 jours' },
  { value: '90',  label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

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

export default function AdminStatsBanques() {
  const [period, setPeriod]               = useState('30');
  const [banques, setBanques]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchBanques = useCallback(() => {
    setLoading(true);
    api.get('/admin/stats/banques', { params: { period } })
      .then((r) => setBanques(r.data.data.banques))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { fetchBanques(); }, [fetchBanques]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    api.get(`/admin/stats/banques/${selectedId}`, { params: { period } })
      .then((r) => setDetail(r.data.data))
      .finally(() => setDetailLoading(false));
  }, [selectedId, period]);

  const evolutionData = detail ? pivotEvolution(detail.evolution) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stats de signalement par banque</h1>
        <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Retour au dashboard</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
              period === p.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden mb-8">
          {banques.length === 0 && (
            <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucun signalement sur cette période.</p>
          )}
          {banques.map((b, i) => (
            <button
              key={b.banque_id}
              onClick={() => setSelectedId(b.banque_id)}
              className={`w-full text-left px-5 py-3 flex justify-between items-center cursor-pointer ${
                i < banques.length - 1 ? 'border-b border-slate-100' : ''
              } ${selectedId === b.banque_id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <span className="font-semibold text-gray-900 text-sm">{b.banque_nom}</span>
              <span className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  {b.total_signalements} signalement{b.total_signalements > 1 ? 's' : ''}
                </span>
                <span className={`font-bold ${
                  b.taux_disponibilite === null ? 'text-slate-400'
                    : b.taux_disponibilite >= 70 ? 'text-green-600'
                    : b.taux_disponibilite >= 40 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {b.taux_disponibilite !== null ? `${b.taux_disponibilite}%` : '—'}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          {detailLoading || !detail ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{detail.banque.nom}</h2>

              <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend formatter={(key) => ETAT_LABELS[key] || key} />
                    {Object.keys(ETAT_COLORS).map((etat) => (
                      <Line
                        key={etat}
                        type="monotone"
                        dataKey={etat}
                        stroke={ETAT_COLORS[etat]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                DAB les plus signalés vide/en panne
              </h3>
              {detail.topDabProblematiques.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun signalement négatif sur cette période.</p>
              ) : (
                <div className="space-y-2">
                  {detail.topDabProblematiques.map((d) => (
                    <div key={d.id} className="flex justify-between items-center text-sm px-3 py-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{d.nom}</p>
                        <p className="text-xs text-slate-500">{d.adresse}</p>
                      </div>
                      <span className="font-bold text-red-600">{d.total_negatif}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
