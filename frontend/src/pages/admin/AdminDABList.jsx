import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDABs, deleteDAB } from '../../api/dabApi';
import api from '../../api/axiosConfig';
import { statutLabel, etatLabel } from '../../utils/formatUtils';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

export default function AdminDABList() {
  const { t } = useTranslation();
  const [dabs, setDabs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [banques, setBanques] = useState([]);
  const [banqueId, setBanqueId] = useState('');

  useEffect(() => {
    api.get('/banques').then((r) => setBanques(r.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 30 };
    if (banqueId) params.banque_id = banqueId;
    getDABs(params)
      .then((r) => {
        let data = r.data || [];
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          data = data.filter((d) =>
            d.nom?.toLowerCase().includes(q) ||
            d.adresse?.toLowerCase().includes(q)
          );
        }
        setDabs(data);
      })
      .finally(() => setLoading(false));
  }, [page, banqueId, search]);

  useEffect(() => { load(); }, [load]);

  // Remettre à la page 1 quand les filtres changent
  useEffect(() => { setPage(1); }, [banqueId, search]);

  const handleDelete = async (id, nom) => {
    if (!window.confirm(t('admin.confirm_delete', { name: nom }))) return;
    try {
      await deleteDAB(id);
      toast.success(t('admin.deleted'));
      load();
    } catch {
      toast.error(t('admin.delete_error'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="m-0 text-2xl font-bold text-gray-900">{t('admin.manage_dabs')}</h1>
        <Link to="/admin/dabs/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          {t('admin.new_dab')}
        </Link>
      </div>

      {/* Barre de recherche + filtre banque */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={t('admin.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={banqueId}
          onChange={(e) => setBanqueId(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
        >
          <option value="">{t('admin.all_banks')}</option>
          {banques.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </select>
        {(search || banqueId) && (
          <button
            onClick={() => { setSearch(''); setBanqueId(''); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-gray-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {t('admin.reset')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : dabs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          {t('admin.no_dabs')}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[t('admin.col_name'), t('admin.col_bank'), t('admin.col_status'), t('admin.col_state'), t('admin.col_actions')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dabs.map((dab, i) => (
                <tr key={dab.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i === dabs.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{dab.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{dab.banque_nom || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{statutLabel(dab.statut)}</td>
                  <td className="px-4 py-3 text-gray-700">{dab.etat_communautaire ? etatLabel(dab.etat_communautaire) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link to={`/admin/dabs/${dab.id}/edit`} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        {t('admin.edit')}
                      </Link>
                      <button
                        onClick={() => handleDelete(dab.id, dab.nom)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                      >
                        {t('admin.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 mt-4 justify-center items-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          ←
        </button>
        <span className="px-3 py-1.5 text-sm text-slate-500">{t('admin.page', { page })}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={dabs.length < 30}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          →
        </button>
      </div>
    </div>
  );
}
