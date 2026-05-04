import { useTranslation } from 'react-i18next';
import { etatColor, formatDate } from '../../utils/formatUtils';
import SignalementBadge from '../Signalement/SignalementBadge';
import SignalementButton from '../Signalement/SignalementButton';
import AvisList from '../Avis/AvisList';
import AvisForm from '../Avis/AvisForm';
import useAuth from '../../hooks/useAuth';
import useGeolocation from '../../hooks/useGeolocation';

const DOT_CLASS = {
  green:  'bg-green-500',
  orange: 'bg-amber-500',
  red:    'bg-red-500',
  gray:   'bg-gray-400',
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

export default function DABDetail({ dab, onSignalement }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { position, status, isDefault, requestLocation } = useGeolocation();
  const color = etatColor(dab);

  const statutTrad = STATUT_KEY[dab.statut] ? t(STATUT_KEY[dab.statut]) : dab.statut;
  const etatTrad   = dab.etat_communautaire
    ? (ETAT_KEY[dab.etat_communautaire] ? t(ETAT_KEY[dab.etat_communautaire]) : dab.etat_communautaire)
    : '—';

  // Position GPS réelle uniquement si le statut est 'granted' et qu'on a une position non-default
  const userPosition = (status === 'granted' && !isDefault) ? position : null;

  return (
    <div className="max-w-[680px] mx-auto p-4">
      {/* En-tête */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ${DOT_CLASS[color] ?? 'bg-gray-400'}`} />
        <div className="min-w-0">
          <h1 className="m-0 text-xl font-bold text-gray-900 leading-snug">{dab.nom}</h1>
          {dab.adresse && (
            <p className="mt-0.5 text-sm text-slate-500">{dab.adresse}</p>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="bg-slate-50 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
        <Info label={t('dab.status_admin')}  value={statutTrad} />
        <Info label={t('dab.state_reported')} value={etatTrad} />
        {dab.banque_nom && <Info label={t('dab.bank')} value={dab.banque_nom} />}
        {dab.etat_communautaire_at && <Info label={t('dab.updated')} value={formatDate(dab.etat_communautaire_at)} />}
        {dab.services?.length > 0 && (
          <Info label={t('dab.services')} value={dab.services.map((s) => s.nom).join(', ')} />
        )}
      </div>

      {/* Signalement communautaire */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
          {t('dab.community_state')}
        </h2>
        <SignalementBadge dabId={dab.id} currentEtat={dab.etat_communautaire} />
        <div className="mt-3">
          <SignalementButton
            dabId={dab.id}
            onSuccess={onSignalement}
            geoStatus={status}
            userPosition={userPosition}
            dabLat={parseFloat(dab.latitude)}
            dabLng={parseFloat(dab.longitude)}
            requestLocation={requestLocation}
          />
        </div>
      </section>

      {/* Avis */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
          {t('dab.user_reviews')}
        </h2>
        {isAuthenticated && <AvisForm dabId={dab.id} onSuccess={() => {}} />}
        <AvisList dabId={dab.id} />
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="m-0 text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}
