import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosConfig';
import { resoudreSignalements } from '../../api/signalementApi';
import { etatLabel, formatDate } from '../../utils/formatUtils';
import Spinner from '../../components/UI/Spinner';
import toast from 'react-hot-toast';

const ETAT_CLASS = {
  disponible: 'bg-green-600',
  vide:       'bg-amber-700',
  en_panne:   'bg-red-700',
};

export default function AdminSignalements() {
  const { t } = useTranslation();
  const [dabs, setDabs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/signalements')
      .then((r) => setDabs(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleResoudre = async (dab) => {
    if (!window.confirm(t('admin.confirm_resolve', { name: dab.nom }))) return;
    try {
      await resoudreSignalements(dab.id);
      toast.success(t('admin.resolved'));
      load();
    } catch {
      toast.error(t('admin.resolve_error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : dabs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('admin.no_reports')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {dabs.map((dab) => {
            const votes = dab.votes || {};
            const total = Object.values(votes).reduce((a, b) => a + b, 0);
            return (
              <div key={dab.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="m-0 font-semibold text-sm text-gray-900">{dab.nom}</p>
                  {dab.adresse && (
                    <p className="mt-0.5 text-xs text-slate-400">{dab.adresse}</p>
                  )}
                  <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                    {Object.entries(votes).map(([etat, nb]) => (
                      <span key={etat} className={`text-xs font-semibold text-white rounded-full px-2 py-0.5 ${ETAT_CLASS[etat] ?? 'bg-slate-500'}`}>
                        {etatLabel(etat)} × {nb}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400">{total} vote(s)</span>
                  </div>
                  {dab.etat_communautaire && (
                    <p className="mt-1 text-xs text-gray-700">
                      {t('admin.triggered_state')} <strong>{etatLabel(dab.etat_communautaire)}</strong>
                      {dab.etat_communautaire_at && ` · ${formatDate(dab.etat_communautaire_at)}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleResoudre(dab)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer"
                >
                  {t('admin.resolve')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
