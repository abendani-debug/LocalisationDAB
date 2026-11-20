import { useTranslation } from 'react-i18next';
import { etatColor, formatDistance } from '../../utils/formatUtils';

const BADGE = {
  green:  'bg-green-600 text-white',
  orange: 'bg-amber-500 text-white',
  red:    'bg-red-600   text-white',
};

const ETAT_BADGE = {
  disponible: 'bg-green-600 text-white',
  vide:       'bg-amber-500 text-white',
  en_panne:   'bg-red-600   text-white',
};

const STATUT_KEY = {
  actif:        'filters.active',
  hors_service: 'filters.out_of_service',
  maintenance:  'filters.maintenance',
};

const ETAT_KEY = {
  disponible: 'signalement.available',
  vide:       'signalement.empty',
  en_panne:   'signalement.broken',
};

export default function DABCard({ dab, onSelect, onHighlight }) {
  const { t } = useTranslation();
  const color = etatColor(dab);

  const statutTrad = STATUT_KEY[dab.statut] ? t(STATUT_KEY[dab.statut]) : dab.statut;
  const etatKey    = dab.etat_communautaire || dab.vote_dominant;
  const etatTrad   = etatKey ? (ETAT_KEY[etatKey] ? t(ETAT_KEY[etatKey]) : etatKey) : null;

  return (
    <div
      onClick={() => onHighlight?.(dab.id)}
      className="dab-card-in bg-white border border-slate-100 rounded-xl p-3.5 cursor-pointer transition-all hover:border-blue-200 hover:shadow-sm flex flex-col gap-2"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">
          🏧
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 font-semibold text-sm text-gray-900 truncate">{dab.nom}</p>
          {dab.adresse && (
            <p className="m-0 mt-0.5 text-xs text-slate-400 truncate">{dab.adresse}</p>
          )}
        </div>
        {dab.distance_km != null && (
          <span className="text-xs font-medium text-slate-400 flex-shrink-0">
            {formatDistance(dab.distance_km)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${BADGE[color] || 'bg-gray-100 text-gray-500'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
          {statutTrad}
        </span>

        {dab.banque_nom && (
          <span className="text-[10px] text-slate-500">{dab.banque_nom}</span>
        )}

        {(dab.etat_communautaire || dab.vote_dominant) && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ETAT_BADGE[dab.etat_communautaire || dab.vote_dominant] || 'bg-gray-100 text-gray-500'}`}
            style={{ opacity: dab.etat_communautaire ? 1 : 0.75 }}>
            👥 {etatTrad}
          </span>
        )}
      </div>
    </div>
  );
}
