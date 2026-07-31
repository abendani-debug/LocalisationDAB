import { useRef, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { etatColor, statutLabel, etatLabel, formatDistance, haversineKm } from '../../utils/formatUtils';
import { getBankConfig } from '../../utils/bankConfig';
import { submitSignalement, getLocalVote } from '../../api/signalementApi';
import toast from 'react-hot-toast';

const STATUS_BORDER = { green: '#16a34a', orange: '#ea580c', red: '#dc2626', neutral: '#9ca3af' };
const STATUS_BG     = { green: '#dcfce7', orange: '#ffedd5', red: '#fee2e2', neutral: '#f3f4f6' };
const STATUS_TEXT   = { green: '#15803d', orange: '#c2410c', red: '#b91c1c', neutral: '#6b7280' };
const STATUS_HALO   = {
  green:   '0 0 0 4px rgba(22,163,74,0.30), 0 2px 8px rgba(0,0,0,0.25)',
  orange:  '0 0 0 4px rgba(234,88,12,0.30), 0 2px 8px rgba(0,0,0,0.25)',
  red:     '0 0 0 4px rgba(220,38,38,0.30), 0 2px 8px rgba(0,0,0,0.25)',
  neutral: '0 2px 8px rgba(0,0,0,0.20)',
};

const ETAT_SOLID = {
  disponible: { bg: '#16a34a', text: '#fff' },
  vide:       { bg: '#ea580c', text: '#fff' },
  en_panne:   { bg: '#dc2626', text: '#fff' },
};

/* ─── Création de l'icône ─────────────────────────────────────────── */

const createIcon = (dab, statusColor) => {
  const border   = STATUS_BORDER[statusColor] || STATUS_BORDER.neutral;
  const halo     = STATUS_HALO[statusColor]   || STATUS_HALO.neutral;
  const bankCfg  = getBankConfig(dab.banque_nom) || getBankConfig(dab.nom);

  let innerContent;
  let circleBg;

  if (bankCfg?.logoUrl) {
    // Logo réel — fond blanc, fallback sur abréviation colorée
    circleBg = '#ffffff';
    const logoSize = bankCfg.logoSize || 24;
    innerContent = `
      <img
        src="${bankCfg.logoUrl}"
        width="${logoSize}" height="${logoSize}"
        style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;flex-shrink:0;"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
      />
      <span style="
        display:none;
        width:30px;height:30px;
        background:${bankCfg.bg};
        border-radius:50%;
        align-items:center;justify-content:center;
        font-size:${bankCfg.abbr.length <= 2 ? 12 : bankCfg.abbr.length === 3 ? 10 : 8}px;
        font-weight:900;
        color:${bankCfg.text};
        line-height:1;
      ">${bankCfg.abbr}</span>`;
  } else if (bankCfg) {
    // Pas de logo — badge coloré avec abréviation
    circleBg = bankCfg.bg;
    innerContent = `
      <span style="
        font-size:${bankCfg.abbr.length <= 2 ? 13 : bankCfg.abbr.length === 3 ? 10.5 : 8.5}px;
        font-weight:900;
        color:${bankCfg.text};
        letter-spacing:0.3px;
        line-height:1;
        text-align:center;
      ">${bankCfg.abbr}</span>`;
  } else {
    // ATM générique — icône distributeur
    circleBg = STATUS_BORDER[statusColor] || STATUS_BORDER.neutral;
    innerContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 44 44">
        <rect x="6" y="22" width="32" height="16" rx="2" fill="white"/>
        <rect x="10" y="16" width="24" height="8"  rx="2" fill="white"/>
        <polygon points="22,5 8,16 36,16"                fill="white"/>
        <rect x="10" y="23" width="7"  height="12" fill="${circleBg}"/>
        <rect x="18.5" y="23" width="7" height="12" fill="${circleBg}"/>
        <rect x="27" y="23" width="7"  height="12" fill="${circleBg}"/>
      </svg>`;
  }

  const html = `
    <div class="dab-icon-inner" style="
      position:relative;
      width:44px;height:54px;
      display:flex;flex-direction:column;align-items:center;
    ">
      <!-- Cercle logo -->
      <div style="
        width:40px;height:40px;min-width:40px;min-height:40px;
        border-radius:50%;
        background:${circleBg};
        border:3px solid ${border};
        box-shadow:${halo};
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        flex-shrink:0;
        position:relative;
      ">
        ${innerContent}
      </div>
      <!-- Pointe -->
      <div style="
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:14px solid ${border};
        margin-top:-1px;
        filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
      "></div>
    </div>`;

  return L.divIcon({
    className: 'dab-marker',
    html,
    iconSize:   [44, 54],
    iconAnchor: [22, 54],
    popupAnchor:[0, -56],
  });
};

/* ─── Composant ──────────────────────────────────────────────────── */

const GEO_LIMIT_KM = 1;

const ETATS = [
  { key: 'disponible', emoji: '✅', label: 'Disponible', color: '#16a34a' },
  { key: 'vide',       emoji: '💸', label: 'Vide',       color: '#ea580c' },
  { key: 'en_panne',   emoji: '🔧', label: 'En panne',   color: '#dc2626' },
];

export default function DABMarker({ dab, userPosition, geoStatus, requestLocation, onSelectDAB, highlightTick, isActive, isAdmin, onAdminEdit }) {
  const { t } = useTranslation();
  const statusColor = etatColor(dab);
  const icon        = createIcon(dab, statusColor);
  const bankCfg     = getBankConfig(dab.banque_nom) || getBankConfig(dab.nom);
  const markerRef   = useRef(null);
  const timerRef    = useRef(null);

  const [myVote,    setMyVote]    = useState(() => getLocalVote(dab.id));
  const [loading,   setLoading]   = useState(false);
  const [justVoted, setJustVoted] = useState(null);
  const [selected,  setSelected]  = useState(null);

  const distanceKm = (geoStatus === 'granted' && userPosition)
    ? haversineKm(userPosition.lat, userPosition.lng, parseFloat(dab.latitude), parseFloat(dab.longitude))
    : null;
  const tooFar = distanceKm !== null && distanceKm > GEO_LIMIT_KM;

  const handleSignal = async (etat) => {
    setSelected(etat);
    setLoading(true);
    try {
      const res = await submitSignalement(dab.id, etat, userPosition.lat, userPosition.lng);
      const wasModified = res.data?.modified ?? false;
      toast.success(wasModified ? t('signalement.modified_success') : t('signalement.success'));
      setMyVote({ etat, nb_updates: wasModified ? 1 : 0 });
      setJustVoted(etat);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) toast.error(t('signalement.same_state'));
      else if (status === 429) toast.error(t('signalement.already_modified'));
      else toast.error(t('signalement.error'));
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!highlightTick) return;
    const el = markerRef.current?.getElement();
    if (!el) return;

    // Force restart de l'animation même si déjà en cours
    el.classList.remove('dab-marker-highlighted');
    void el.offsetWidth; // reflow pour reset l'animation CSS
    el.classList.add('dab-marker-highlighted');

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      el.classList.remove('dab-marker-highlighted');
    }, 2300);

    return () => clearTimeout(timerRef.current);
  }, [highlightTick]);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;
    el.classList.toggle('dab-marker-active', !!isActive);
  }, [isActive, highlightTick]);

  return (
    <Marker
      ref={markerRef}
      position={[parseFloat(dab.latitude), parseFloat(dab.longitude)]}
      icon={icon}
    >
      <Popup minWidth={230}>
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>

          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>

            {/* Miniature logo */}
            <div style={{
              width: 38, height: 38, borderRadius: '8px', flexShrink: 0,
              background: bankCfg?.logoUrl ? '#fff' : (bankCfg ? bankCfg.bg : STATUS_BORDER[statusColor]),
              border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}>
              {bankCfg?.logoUrl ? (
                <img
                  src={bankCfg.logoUrl}
                  alt={bankCfg.label}
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28, objectFit: 'contain', display: 'block', flexShrink: 0 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span style={{
                display: bankCfg?.logoUrl ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%',
                color: bankCfg ? bankCfg.text : '#fff',
                fontWeight: 900,
                fontSize: bankCfg
                  ? (bankCfg.abbr.length <= 2 ? '0.9rem' : bankCfg.abbr.length === 3 ? '0.75rem' : '0.6rem')
                  : '0.7rem',
              }}>
                {bankCfg ? bankCfg.abbr : (dab.type === 'bank' ? '🏦' : '🏧')}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: '0.88rem',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {dab.nom}
              </div>
              {bankCfg && (
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{bankCfg.label}</div>
              )}
              <span style={{
                display: 'inline-block', marginTop: '2px',
                padding: '1px 6px', borderRadius: '4px',
                fontSize: '0.62rem', fontWeight: 700,
                background: dab.type === 'bank' ? '#dbeafe' : '#fef9c3',
                color:      dab.type === 'bank' ? '#1d4ed8' : '#854d0e',
              }}>
                {dab.type === 'bank' ? 'Agence bancaire' : 'Distributeur'}
              </span>
            </div>
          </div>

          {/* Adresse */}
          {dab.adresse && (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>📍</span>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', lineHeight: 1.35 }}>{dab.adresse}</span>
            </div>
          )}

          {/* Distance */}
          {dab.distance_km != null && (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>🚶</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                {formatDistance(dab.distance_km)}
              </span>
            </div>
          )}

          {/* Statuts */}
          <div style={{ marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.55rem',
                borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
                background: '#f3f4f6', color: '#374151',
              }}>
                {statutLabel(dab.statut)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600 }}>Signalé :</span>
              {dab.etat_communautaire ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                  background: ETAT_SOLID[dab.etat_communautaire]?.bg || '#6b7280',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}>
                  👥 {etatLabel(dab.etat_communautaire)}
                </span>
              ) : dab.vote_dominant ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                  background: ETAT_SOLID[dab.vote_dominant]?.bg || '#854d0e',
                  color: '#fff',
                  opacity: 0.75,
                }}>
                  👥 {etatLabel(dab.vote_dominant)}
                </span>
              ) : (
                <span style={{
                  display: 'inline-block', padding: '0.2rem 0.55rem',
                  borderRadius: '999px', fontSize: '0.72rem', fontWeight: 500,
                  background: '#f3f4f6', color: '#9ca3af',
                }}>
                  Aucun signalement
                </span>
              )}
            </div>
          </div>

          {/* ── Signalement rapide ── */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.55rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>
              Comment est-il maintenant ?
            </div>

            {/* Géoloc non demandée */}
            {(!geoStatus || geoStatus === 'idle' || geoStatus === 'requesting') && (
              <button
                onClick={requestLocation}
                disabled={geoStatus === 'requesting'}
                style={{
                  width: '100%', padding: '0.4rem',
                  background: '#eff6ff', color: '#1d4ed8',
                  border: '1px dashed #93c5fd', borderRadius: '0.4rem',
                  cursor: geoStatus === 'requesting' ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem', fontWeight: 600,
                }}
              >
                📍 {t('signalement.geo_activate')}
              </button>
            )}

            {/* Géoloc refusée */}
            {(geoStatus === 'denied' || geoStatus === 'unavailable') && (
              <p style={{ fontSize: '0.72rem', color: '#ef4444', textAlign: 'center', margin: 0 }}>
                🔒 {t('signalement.geo_denied')}
              </p>
            )}

            {/* Granted mais position pas encore disponible */}
            {geoStatus === 'granted' && !userPosition && (
              <p style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
                🔄 {t('signalement.geo_locating')}
              </p>
            )}

            {/* Trop loin */}
            {geoStatus === 'granted' && userPosition && tooFar && (
              <p style={{ fontSize: '0.72rem', color: '#d97706', textAlign: 'center', margin: 0 }}>
                📏 {t('signalement.geo_too_far', { distance: formatDistance(distanceKm) })}
              </p>
            )}

            {/* Vient de voter */}
            {geoStatus === 'granted' && userPosition && !tooFar && justVoted && (
              <div style={{
                padding: '0.4rem', textAlign: 'center',
                background: '#f0fdf4', borderRadius: '0.4rem',
                fontSize: '0.75rem', color: '#16a34a', fontWeight: 700,
              }}>
                ✅ {t('signalement.success')}
              </div>
            )}

            {/* Déjà voté */}
            {geoStatus === 'granted' && userPosition && !tooFar && !justVoted && myVote && (
              <div style={{
                padding: '0.35rem 0.5rem',
                background: '#eff6ff', borderRadius: '0.4rem',
                fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.3rem',
              }}>
                <span>
                  {t('signalement.already_voted', {
                    etat: `${ETATS.find(e => e.key === myVote.etat)?.emoji} ${ETATS.find(e => e.key === myVote.etat)?.label}`,
                  })}
                </span>
                {myVote.nb_updates === 0 && (
                  <button
                    onClick={() => setMyVote(null)}
                    style={{
                      padding: '0.15rem 0.4rem', background: '#1d4ed8', color: '#fff',
                      border: 'none', borderRadius: '0.25rem', cursor: 'pointer',
                      fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {t('signalement.modify')}
                  </button>
                )}
              </div>
            )}

            {/* 3 boutons de vote */}
            {geoStatus === 'granted' && userPosition && !tooFar && !justVoted && !myVote && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {ETATS.map(({ key, emoji, label, color }) => {
                  const isSelected = selected === key;
                  return (
                    <button
                      key={key}
                      disabled={loading}
                      onClick={() => handleSignal(key)}
                      style={{
                        flex: 1, padding: '0.4rem 0.2rem',
                        background: isSelected ? color : '#fff',
                        border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
                        borderRadius: '0.4rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.7rem', fontWeight: 700,
                        color: isSelected ? '#fff' : '#374151',
                        textAlign: 'center', opacity: loading && !isSelected ? 0.4 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', lineHeight: 1 }}>{emoji}</div>
                      <div style={{ fontSize: '0.62rem', marginTop: '2px' }}>{label}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => onSelectDAB?.(dab.id)}
              style={{
                flex: 1, padding: '0.4rem',
                background: bankCfg ? bankCfg.bg : '#3b82f6',
                color: bankCfg ? bankCfg.text : '#fff',
                border: 'none', borderRadius: '0.4rem',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              Voir détail →
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1${userPosition ? `&origin=${userPosition.lat},${userPosition.lng}` : ''}&destination=${dab.latitude},${dab.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '0.4rem',
                background: (dab.etat_communautaire === 'disponible' || dab.vote_dominant === 'disponible')
                  ? '#1d4ed8'
                  : '#16a34a',
                color: '#fff',
                border: 'none', borderRadius: '0.4rem',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                textDecoration: 'none', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
              }}
            >
              🧭 Y aller
            </a>
          </div>

          {/* Boutons admin */}
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdminEdit?.(dab); }}
              style={{
                width: '100%', marginTop: '0.4rem', padding: '0.4rem',
                background: '#fef3c7', color: '#92400e',
                border: '1px solid #fcd34d', borderRadius: '0.4rem',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}
            >
              ✏️ Modération admin
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
