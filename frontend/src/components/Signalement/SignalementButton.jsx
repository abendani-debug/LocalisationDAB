import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { submitSignalement, getLocalVote } from '../../api/signalementApi';
import { haversineKm, formatDistance } from '../../utils/formatUtils';
import toast from 'react-hot-toast';

const GEO_LIMIT_KM = 1;

export default function SignalementButton({ dabId, onSuccess, geoStatus, userPosition, dabLat, dabLng, requestLocation }) {
  const { t } = useTranslation();
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [myVote,     setMyVote]     = useState(null);   // { etat, nb_updates }
  const [modifyMode, setModifyMode] = useState(false);

  useEffect(() => {
    setMyVote(getLocalVote(dabId));
  }, [dabId]);

  const ETATS = [
    { key: 'disponible', label: t('signalement.available'), emoji: '✅', border: 'hover:border-green-500',  active: 'border-green-500 bg-green-50' },
    { key: 'vide',       label: t('signalement.empty'),     emoji: '💸', border: 'hover:border-amber-500', active: 'border-amber-500 bg-amber-50' },
    { key: 'en_panne',   label: t('signalement.broken'),    emoji: '🔧', border: 'hover:border-red-500',   active: 'border-red-500   bg-red-50'   },
  ];

  // Calcul distance (null si pas de position réelle)
  const distanceKm = (geoStatus === 'granted' && userPosition)
    ? haversineKm(userPosition.lat, userPosition.lng, dabLat, dabLng)
    : null;

  const tooFar = distanceKm !== null && distanceKm > GEO_LIMIT_KM;

  // --- État : géoloc pas encore demandée ---
  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-500 mb-3">{t('signalement.geo_idle')}</p>
        <button
          onClick={requestLocation}
          disabled={geoStatus === 'requesting'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed font-[inherit]"
        >
          {geoStatus === 'requesting' ? '…' : t('signalement.geo_activate')}
        </button>
      </div>
    );
  }

  // --- État : géoloc refusée ou indisponible ---
  if (geoStatus === 'denied' || geoStatus === 'unavailable') {
    return (
      <div className="rounded-xl border-2 border-dashed border-red-200 p-4 text-center">
        <p className="text-sm text-red-500">{t('signalement.geo_denied')}</p>
      </div>
    );
  }

  // --- État : granted mais position réelle pas encore disponible ---
  if (geoStatus === 'granted' && !userPosition) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-500">{t('signalement.geo_locating')}</p>
      </div>
    );
  }

  // --- État : trop loin ---
  if (tooFar) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-200 p-4 text-center">
        <p className="text-sm text-amber-600">
          {t('signalement.geo_too_far', { distance: formatDistance(distanceKm) })}
        </p>
      </div>
    );
  }

  // --- État normal : à portée ---
  const handleSignal = async (etat) => {
    setSelected(etat);
    setLoading(true);
    try {
      const res = await submitSignalement(dabId, etat, userPosition.lat, userPosition.lng);
      const wasModified = res.data?.modified ?? false;
      toast.success(wasModified ? t('signalement.modified_success') : t('signalement.success'));
      setMyVote({ etat, nb_updates: wasModified ? 1 : 0 });
      setModifyMode(false);
      onSuccess?.(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || t('signalement.error');
      if (status === 409) toast.error(t('signalement.same_state'));
      else if (status === 429) toast.error(t('signalement.already_modified'));
      else toast.error(msg);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Bandeau vote existant ---
  if (myVote && !modifyMode) {
    const etatCfg = ETATS.find((e) => e.key === myVote.etat);
    return (
      <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-700 font-semibold mb-1">
          {t('signalement.already_voted', { etat: `${etatCfg?.emoji} ${etatCfg?.label}` })}
        </p>
        <p className="text-xs text-blue-400 mb-3">{t('signalement.modify_hint')}</p>
        {myVote.nb_updates === 0 ? (
          <button
            onClick={() => { setModifyMode(true); setSelected(null); }}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer font-[inherit]"
          >
            {t('signalement.modify')}
          </button>
        ) : (
          <p className="text-xs text-slate-400 text-center italic">{t('signalement.already_modified')}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {modifyMode && (
        <p className="text-xs text-amber-600 font-semibold mb-2 text-center">
          ⚠️ {t('signalement.modify')}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ETATS.map(({ key, label, emoji, border, active }) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => setSelected(key)}
            className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer bg-white font-[inherit]
              disabled:opacity-60 disabled:cursor-not-allowed
              ${selected === key ? active : `border-slate-200 ${border}`}`}
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-[11px] font-semibold text-gray-700">{label}</div>
          </button>
        ))}
      </div>
      <button
        disabled={!selected || loading}
        onClick={() => selected && handleSignal(selected)}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed font-[inherit]"
      >
        {loading ? t('signalement.sending') : modifyMode ? t('signalement.modify') : t('signalement.send')}
      </button>
    </div>
  );
}
