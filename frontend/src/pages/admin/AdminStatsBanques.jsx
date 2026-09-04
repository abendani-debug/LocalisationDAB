// frontend/src/pages/admin/AdminStatsBanques.jsx
import { useState, useEffect, useCallback } from 'react';
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
    let ignore = false;
    setDetail(null);
    setDetailLoading(true);
    api.get(`/admin/stats/banques/${selectedId}`, { params: { period } })
      .then((r) => { if (!ignore) setDetail(r.data.data); })
      .catch(() => { if (!ignore) setDetail(null); })
      .finally(() => { if (!ignore) setDetailLoading(false); });
    return () => { ignore = true; };
  }, [selectedId, period]);

  const evolutionData = detail ? pivotEvolution(detail.evolution) : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
              period === p.value ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : banques.length === 0 ? (
        <div className="bg-white border border-[#e5eeec] rounded-xl mb-8">
          <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucune banque sur cette période.</p>
        </div>
      ) : (
        <div className="mb-8">
          <label htmlFor="banque-select" className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Banque
          </label>
          <select
            id="banque-select"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer"
          >
            <option value="">— Choisir une banque —</option>
            {[...banques]
              .sort((a, b) => a.banque_nom.localeCompare(b.banque_nom))
              .map((b) => (
                <option key={b.banque_id} value={b.banque_id}>
                  {b.banque_nom} — {b.total_signalements} signalement{b.total_signalements > 1 ? 's' : ''}
                  {b.taux_disponibilite !== null ? ` (${b.taux_disponibilite}%)` : ''}
                </option>
              ))}
          </select>
        </div>
      )}

      {selectedId && (
        <div className="bg-white border border-[#e5eeec] rounded-xl p-5">
          {detailLoading || !detail ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#0b3b36] mb-4">{detail.banque.nom}</h2>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {(() => {
                  const totalParEtat = detail.parEtat.reduce((s, e) => s + e.total, 0);
                  return ['disponible', 'vide', 'en_panne'].map((etat) => {
                    const count = detail.parEtat.find((e) => e.etat === etat)?.total || 0;
                    const pct = totalParEtat > 0 ? Math.round((count / totalParEtat) * 100) : null;
                    return (
                      <div key={etat} className="border border-[#e5eeec] rounded-lg p-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: ETAT_COLORS[etat] }}>
                          {ETAT_LABELS[etat]}
                        </p>
                        <p className="text-2xl font-bold text-[#0b3b36]">{count}</p>
                        <p className="text-xs text-slate-400">{pct !== null ? `${pct}%` : '—'}</p>
                      </div>
                    );
                  });
                })()}
              </div>

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
                    <div key={d.id} className="flex justify-between items-center text-sm px-3 py-2 bg-[#f7faf9] rounded-lg">
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
