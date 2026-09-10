// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PERIODS = [
  { value: '7',   label: '7 jours' },
  { value: '30',  label: '30 jours' },
  { value: '90',  label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

const ETAT_COLORS = { disponible: '#16a34a', vide: '#f59e0b', en_panne: '#dc2626' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne' };

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [importing, setImporting] = useState(false);
  const [period, setPeriod]         = useState('30');
  const [etatStats, setEtatStats]   = useState([]);
  const [etatLoading, setEtatLoading] = useState(true);
  const [zones, setZones]           = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setEtatLoading(true);
    api.get('/admin/stats/etat', { params: { period } })
      .then((r) => setEtatStats(r.data.data.parEtat))
      .finally(() => setEtatLoading(false));
  }, [period]);

  useEffect(() => {
    setZonesLoading(true);
    api.get('/admin/stats/geographie', { params: { period } })
      .then((r) => setZones(r.data.data.zones))
      .finally(() => setZonesLoading(false));
  }, [period]);

  const handleImportGoogle = async () => {
    if (!window.confirm(t('admin.confirm_import_google'))) return;
    setImporting(true);
    try {
      const res = await api.post('/admin/import-google');
      const d = res.data.data;
      toast.success(t('admin.import_success', { inserted: d.inserted, updated: d.updated }));
    } catch {
      toast.error(t('admin.import_error'));
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Spinner /></div>;

  const totalDABs      = stats?.dabs?.reduce((s, r) => s + r.total, 0) || 0;
  const nbPropositions = stats?.propositions?.total || 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label={t('admin.total_dabs')}        value={totalDABs} />
        <KPICard label={t('admin.users')}              value={stats?.users?.total || 0} />
        <KPICard label={t('admin.active_reports')}     value={stats?.signalements?.total || 0} />
        <KPICard label={t('admin.pending_proposals')}  value={nbPropositions} highlight={nbPropositions > 0} />
      </div>

      {/* Action */}
      <div className="mb-6">
        <button
          onClick={handleImportGoogle}
          disabled={importing}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          {importing ? t('admin.importing') : t('admin.import_google')}
        </button>
      </div>

      {/* Répartition statuts */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{t('admin.status_distribution')}</h2>
        <div className="bg-white border border-[#e5eeec] rounded-xl overflow-hidden">
          {stats?.dabs?.map((row, i) => (
            <div
              key={row.statut}
              className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < stats.dabs.length - 1 ? 'border-b border-[#e5eeec]' : ''}`}
            >
              <span className="text-gray-700 capitalize">{row.statut}</span>
              <strong className="text-[#0b3b36]">{row.total}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition des signalements par état */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Signalements par état
          </h2>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  period === p.value ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#e5eeec] rounded-xl p-5 h-64">
          {etatLoading ? (
            <div className="h-full flex items-center justify-center"><Spinner /></div>
          ) : (() => {
            const pieData = ['disponible', 'vide', 'en_panne']
              .map((etat) => ({
                etat,
                name: ETAT_LABELS[etat],
                value: etatStats.find((e) => e.etat === etat)?.total || 0,
              }))
              .filter((d) => d.value > 0);

            if (pieData.length === 0) {
              return (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  Aucun signalement sur cette période.
                </div>
              );
            }

            return (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.etat} fill={ETAT_COLORS[d.etat]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Signalements par zone géographique (global, plateforme entière) */}
      <div className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
          Signalements par zone géographique
        </h2>
        {zonesLoading ? (
          <div className="py-8 flex justify-center"><Spinner /></div>
        ) : zones.length === 0 ? (
          <div className="bg-white border border-[#e5eeec] rounded-xl">
            <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucun signalement sur cette période.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5eeec] rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f7faf9] border-b border-[#e5eeec]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Ville</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Pays</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Signalements</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z, i) => (
                  <tr
                    key={`${z.country_code}-${z.ville}`}
                    className={i < zones.length - 1 ? 'border-b border-[#e5eeec]' : ''}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">{z.ville}</td>
                    <td className="px-4 py-2.5 text-slate-500">{z.pays_nom}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#0b3b36]">{z.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, highlight = false }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${highlight ? 'border-[#e35d43]' : 'border-[#e5eeec]'}`}>
      <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`m-0 mt-1.5 text-2xl font-extrabold ${highlight ? 'text-[#e35d43]' : 'text-[#0b3b36]'}`}>{value}</p>
    </div>
  );
}
