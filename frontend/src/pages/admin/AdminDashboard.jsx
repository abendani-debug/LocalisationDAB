// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleImportGoogle = async () => {
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
