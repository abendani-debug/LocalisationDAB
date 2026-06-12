import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.title')}</h1>

      {/* Stat cards */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StatCard label={t('admin.total_dabs')}         value={totalDABs} />
        <StatCard label={t('admin.users')}              value={stats?.users?.total || 0} />
        <StatCard label={t('admin.active_reports')}     value={stats?.signalements?.total || 0} />
        <StatCard label={t('admin.pending_proposals')}  value={nbPropositions} highlight={nbPropositions > 0} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Link to="/admin/dabs" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          {t('admin.manage_dabs')}
        </Link>
        <Link to="/admin/signalements" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          {t('admin.reports')}
        </Link>
        <Link
          to="/admin/propositions"
          className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${nbPropositions > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-600 hover:bg-slate-700'}`}
        >
          {t('admin.proposals')}
          {nbPropositions > 0 && (
            <span className="bg-amber-200 text-amber-900 rounded-full px-1.5 py-0.5 text-xs font-bold leading-none">
              {nbPropositions}
            </span>
          )}
        </Link>
        <Link to="/admin/pays" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors">
          🌍 Pays
        </Link>
        <button
          onClick={handleImportGoogle}
          disabled={importing}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          {importing ? t('admin.importing') : t('admin.import_google')}
        </button>
      </div>

      {/* Répartition statuts */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">{t('admin.status_distribution')}</h2>
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          {stats?.dabs?.map((row, i) => (
            <div
              key={row.statut}
              className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < stats.dabs.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <span className="text-gray-700 capitalize">{row.statut}</span>
              <strong className="text-gray-900">{row.total}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`bg-white border rounded-xl px-5 py-4 min-w-[140px] text-center ${highlight ? 'border-amber-300' : 'border-slate-100'}`}>
      <p className={`m-0 text-3xl font-bold ${highlight ? 'text-amber-600' : 'text-blue-600'}`}>{value}</p>
      <p className="m-0 mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
