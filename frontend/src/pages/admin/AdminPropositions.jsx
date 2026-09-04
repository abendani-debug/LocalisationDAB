import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPropositions, approuverProposition, rejeterProposition } from '../../api/dabApi';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const TYPE_BADGE = {
  atm:    { label: '🏧 Distributeur',  class: 'bg-yellow-100 text-yellow-800' },
  agence: { label: '🏦 Agence bancaire', class: 'bg-blue-100 text-blue-700'   },
};

export default function AdminPropositions() {
  const { t } = useTranslation();
  const [propositions, setPropositions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [busy, setBusy]                 = useState(null);

  const load = () => {
    setLoading(true);
    getPropositions()
      .then((r) => setPropositions(r.data || []))
      .catch(() => toast.error(t('admin.load_error')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprouver = async (id, nom) => {
    if (!window.confirm(t('admin.confirm_approve', { name: nom }))) return;
    setBusy(id);
    try {
      await approuverProposition(id);
      toast.success(t('admin.approved', { name: nom }));
      load();
    } catch {
      toast.error(t('admin.approve_error'));
    } finally {
      setBusy(null);
    }
  };

  const handleRejeter = async (id, nom) => {
    if (!window.confirm(t('admin.confirm_reject', { name: nom }))) return;
    setBusy(id);
    try {
      await rejeterProposition(id);
      toast.success(t('admin.rejected', { name: nom }));
      load();
    } catch {
      toast.error(t('admin.reject_error'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="m-0 text-2xl font-bold text-gray-900">{t('admin.proposals_title')}</h1>
        <span className="text-xs text-slate-500">{propositions.length} {t('admin.pending')}</span>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : propositions.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">{t('admin.no_proposals')}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {propositions.map((p) => {
            const typeCfg = TYPE_BADGE[p.type_lieu] || { label: p.type_lieu, class: 'bg-slate-100 text-slate-600' };
            return (
              <div key={p.id} className="bg-white border border-slate-100 rounded-xl px-4 py-4 flex gap-4 items-start">
                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{p.nom}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeCfg.class}`}>
                      {typeCfg.label}
                    </span>
                  </div>
                  {p.banque_nom && (
                    <p className="text-xs text-slate-500 mb-0.5">🏛 {p.banque_nom}</p>
                  )}
                  {p.adresse && (
                    <p className="text-xs text-slate-500 mb-0.5">📍 {p.adresse}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {parseFloat(p.latitude).toFixed(5)}, {parseFloat(p.longitude).toFixed(5)}
                    {' · '}
                    {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {t('admin.view_map')}
                  </a>
                  <button
                    onClick={() => handleApprouver(p.id, p.nom)}
                    disabled={busy === p.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    onClick={() => handleRejeter(p.id, p.nom)}
                    disabled={busy === p.id}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('admin.reject')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
