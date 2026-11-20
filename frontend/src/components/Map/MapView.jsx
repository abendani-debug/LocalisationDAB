import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../../hooks/useIsMobile';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import CountrySelector from '../UI/CountrySelector';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import DABMarker from './DABMarker';
import { FlyToPosition, FlyToTarget, LocateButton } from './MapControls';
import AddDABModal from './AddDABModal';
import AdminQuickEditModal from './AdminQuickEditModal';
import { AuthContext } from '../../context/AuthContext';
import { getBankConfig } from '../../utils/bankConfig';
import toast from 'react-hot-toast';

// Au-delà de ce nombre de DAB affichés, on active le regroupement en clusters
// (zones à réseau bancaire très dense — Île-de-France notamment — où un
// marqueur par DAB rend la carte illisible et lourde à manipuler).
const CLUSTER_THRESHOLD = 150;

/**
 * Icône de cluster = logo de la banque majoritaire dans le groupe (un cluster
 * sur la carte principale peut mélanger plusieurs banques, contrairement à
 * l'embed où le token ne concerne qu'une seule banque) + badge du nombre
 * total de DAB regroupés.
 */
function makeMultiBankClusterIcon(dabByLatLng) {
  return (cluster) => {
    const children = cluster.getAllChildMarkers();
    const tally = {};
    const cfgByKey = {};

    children.forEach((m) => {
      const { lat, lng } = m.getLatLng();
      const dab = dabByLatLng.get(`${lat},${lng}`);
      const cfg = dab ? (getBankConfig(dab.banque_nom) || getBankConfig(dab.nom)) : null;
      // On ignore les DAB sans banque identifiée dans le vote de majorité —
      // sinon un cluster avec 40 Société Générale + 60 entrées "DAB" non
      // brandées affiche l'icône générique alors que SG est l'identité
      // reconnaissable la plus pertinente à montrer. L'icône générique ne
      // reste que pour le cas où AUCUNE banque n'est identifiée.
      if (!cfg) return;
      tally[cfg.key] = (tally[cfg.key] || 0) + 1;
      cfgByKey[cfg.key] = cfg;
    });

    let bestKey = null, bestCount = 0;
    for (const [key, count] of Object.entries(tally)) {
      if (count > bestCount) { bestCount = count; bestKey = key; }
    }
    const bankCfg = cfgByKey[bestKey] || null;
    const count = children.length;
    const badgeColor = count < 10 ? '#16a34a' : count < 100 ? '#f59e0b' : '#dc2626';
    // Même langage visuel que le picto DAB seul (cercle + pointe, voir
    // DABMarker.createIcon) — un cluster est juste un pin "en plus grand"
    // avec un compteur, plutôt qu'une forme différente. Bordure bleue fixe
    // (au lieu de la couleur d'état d'un DAB seul) pour signaler sans
    // ambiguïté "ceci est un groupe", indépendamment des états qu'il contient.
    const size = 48;
    const border = '#2563eb';

    const inner = bankCfg?.logoUrl
      ? `<img src="${bankCfg.logoUrl}" width="28" height="28"
           style="width:28px;height:28px;object-fit:contain;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
         <span style="display:none;width:28px;height:28px;align-items:center;justify-content:center;
           font-size:10px;font-weight:900;color:${bankCfg?.text || '#334155'};">${bankCfg?.abbr || ''}</span>`
      : bankCfg
        ? `<span style="font-size:${bankCfg.abbr.length <= 2 ? 13 : 10}px;font-weight:900;color:${bankCfg.text};">${bankCfg.abbr}</span>`
        : `<span style="font-size:17px;">🏧</span>`;

    const html = `
      <div class="marker-pop-in" style="position:relative;width:${size}px;height:${size + 15}px;display:flex;flex-direction:column;align-items:center;transform-origin:bottom center;">
        <div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;">
          <div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${bankCfg?.logoUrl ? '#fff' : (bankCfg?.bg || '#e2e8f0')};
            border:3px solid ${border};
            box-shadow:0 2px 10px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;overflow:hidden;
          ">${inner}</div>
          <div style="
            position:absolute;top:-5px;right:-6px;min-width:21px;height:21px;padding:0 5px;
            border-radius:11px;background:${badgeColor};color:#fff;
            font-size:11px;font-weight:800;font-family:sans-serif;
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);
          ">${count}</div>
        </div>
        <div style="
          width:0;height:0;
          border-left:9px solid transparent;border-right:9px solid transparent;
          border-top:15px solid ${border};
          margin-top:-1px;
          filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
      </div>`;

    return L.divIcon({
      className: '',
      html,
      iconSize:   [size, size + 15],
      iconAnchor: [size / 2, size + 15],
    });
  };
}

const DEFAULT_LAT  = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT  || '36.7372');

const USER_ICON = L.divIcon({
  className: '',
  html: `
    <div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.35));display:flex;flex-direction:column;align-items:center;">
      <img src="/maps_target.png" width="72" height="72" style="width:72px;height:72px;object-fit:contain;display:block;" />
      <div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:14px solid rgba(0,0,0,0.25);margin-top:-2px;"></div>
    </div>`,
  iconSize:   [72, 88],
  iconAnchor: [36, 88],
});

const DEFAULT_LNG  = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG  || '3.0865');
const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM   || '13', 10);

/* ── Force Leaflet à repeindre les clusters après un remontage du groupe
   (leaflet.markercluster ne repaint pas tout seul tant qu'un zoom/pan réel
   ne survient pas — d'où les icônes invisibles après avoir navigué vers une
   nouvelle zone sans jamais zoomer/dézoomer) ───────────────────────────── */
function ClusterRepaintNudge({ nudgeKey }) {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.fire('moveend'));
    return () => cancelAnimationFrame(id);
  }, [nudgeKey, map]);
  return null;
}

/* ── Centrage sur un pays (utilise useMap à l'intérieur du MapContainer) ─── */
function FlyToCountry({ pays }) {
  const map     = useMap();
  const codeRef = useRef(null);
  useEffect(() => {
    if (!pays || pays.code_iso === codeRef.current) return;
    codeRef.current = pays.code_iso;
    map.setView([parseFloat(pays.center_lat), parseFloat(pays.center_lng)], pays.default_zoom);
  }, [pays, map]);
  return null;
}

/* ── Capture du clic carte en mode "ajout" + déplacement ───── */
function MapClickHandler({ addMode, onMapClick, onCenterChange }) {
  const timerRef = useRef(null);
  useMapEvents({
    click(e) {
      if (addMode) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    moveend(e) {
      const c = e.target.getCenter();
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onCenterChange({ lat: c.lat, lng: c.lng });
      }, 600);
    },
  });
  return null;
}

/* ── Bouton flottant "Proposer un DAB" ──────────────────────── */
function AddButton({ addMode, onClick, isMobile }) {
  const { t } = useTranslation();
  const btn = (
    <button
      onClick={onClick}
      title={addMode ? t('propose.click_map') : t('propose.hint')}
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        bottom: isMobile ? '62px' : '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: isMobile ? '0.7rem 1.4rem' : '0.55rem 1.1rem',
        background: addMode ? '#dc2626' : '#1e40af',
        color: '#fff',
        border: 'none',
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: isMobile ? '0.95rem' : '0.85rem',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'background 0.2s',
        whiteSpace: 'nowrap',
        minHeight: '44px',
      }}
    >
      {addMode ? t('propose.cancel') : (isMobile ? t('propose.button_mobile') : t('propose.button_desktop'))}
    </button>
  );

  /* Sur mobile : portail au niveau body pour échapper aux stacking contexts */
  return isMobile ? createPortal(btn, document.body) : btn;
}

/* ── Bandeau d'instruction en mode ajout ───────────────────── */
function AddModeBanner({ isMobile }) {
  const { t } = useTranslation();
  const banner = (
    <div style={{
      position: isMobile ? 'fixed' : 'absolute',
      top: isMobile ? '66px' : '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '0.5rem 1rem',
      background: '#1e40af',
      color: '#fff',
      borderRadius: '0.5rem',
      fontSize: isMobile ? '0.82rem' : '0.82rem',
      fontWeight: 600,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      pointerEvents: 'none',
      whiteSpace: isMobile ? 'normal' : 'nowrap',
      textAlign: 'center',
      maxWidth: isMobile ? 'calc(100vw - 2rem)' : 'none',
    }}>
      {isMobile ? t('propose.touch_map') : t('propose.click_map_new')}
    </div>
  );

  return isMobile ? createPortal(banner, document.body) : banner;
}

/* ── Composant principal ─────────────────────────────────────── */
export default function MapView({
  dabs = [], userPosition = null, geoStatus, requestLocation, onCenterChange, onSelectDAB,
  highlight = null, flyTo = null, onRefresh,
  paysList = [], selectedCountryCode = null, onCountryChange,
}) {
  const { t } = useTranslation();
  const { isAdmin } = useContext(AuthContext);
  const [addMode, setAddMode]               = useState(false);
  const [modalPosition, setModalPosition]   = useState(null);
  const [adminEditDab, setAdminEditDab]     = useState(null);
  const isMobile = useIsMobile();

  // FlyToCountry uniquement sur changement MANUEL (pas sur auto-détection)
  const [manualFlyPays, setManualFlyPays] = useState(null);

  // Index lat/lng -> dab, pour retrouver la banque de chaque marqueur regroupé
  // dans un cluster (leaflet.markercluster ne connaît que les L.Marker, pas
  // les objets dab d'origine).
  const dabByLatLng = useMemo(() => {
    const map = new Map();
    dabs.forEach((d) => map.set(`${parseFloat(d.latitude)},${parseFloat(d.longitude)}`, d));
    return map;
  }, [dabs]);
  const clusterIconFn = useMemo(() => makeMultiBankClusterIcon(dabByLatLng), [dabByLatLng]);

  const handleCountrySelect = (code) => {
    onCountryChange?.(code);
    const pays = paysList.find(p => p.code_iso === code);
    if (pays) setManualFlyPays(pays);
  };

  const center = userPosition
    ? [userPosition.lat, userPosition.lng]
    : [DEFAULT_LAT, DEFAULT_LNG];

  const handleAddClick = () => {
    setAddMode((v) => !v);
    setModalPosition(null);
  };

  const handleMapClick = (pos) => {
    setModalPosition(pos);
    setAddMode(false);
  };

  const handleSuccess = () => {
    setModalPosition(null);
    toast.success(t('propose.thank_you'), { duration: 5000 });
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', cursor: addMode ? 'crosshair' : '' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt{s}.google.com/vt/lyrs=m&hl=fr&x={x}&y={y}&z={z}"
          subdomains="0123"
          maxZoom={20}
        />

        <MapClickHandler addMode={addMode} onMapClick={handleMapClick} onCenterChange={onCenterChange} />
        {flyTo && <FlyToTarget target={flyTo} />}
        {manualFlyPays && <FlyToCountry pays={manualFlyPays} />}

        {userPosition && (
          <>
            <Marker
              position={[userPosition.lat, userPosition.lng]}
              icon={USER_ICON}
              zIndexOffset={1000}
              interactive={false}
            />
            <FlyToPosition position={userPosition} />
            <LocateButton position={userPosition} />
          </>
        )}

        {(() => {
          const markers = dabs.map((dab) => (
            <DABMarker
              key={dab.id}
              dab={dab}
              userPosition={userPosition}
              geoStatus={geoStatus}
              requestLocation={requestLocation}
              onSelectDAB={onSelectDAB}
              highlightTick={highlight?.id === dab.id ? highlight.tick : 0}
              isActive={highlight?.id === dab.id}
              isAdmin={isAdmin}
              onAdminEdit={setAdminEditDab}
            />
          ));

          // Clé de remontage basée sur le contenu réel du jeu de DAB : la
          // fonction d'icône de cluster est capturée à la construction du
          // groupe par leaflet.markercluster et ne se met pas à jour
          // proprement si seule la prop change après coup (même bug que
          // sur le widget embed, corrigé de la même façon ici).
          const datasetKey = dabs.length ? `${dabs[0].id}-${dabs[dabs.length - 1].id}-${dabs.length}` : 'empty';

          return dabs.length > CLUSTER_THRESHOLD ? (
            <>
              <MarkerClusterGroup key={datasetKey} iconCreateFunction={clusterIconFn}>
                {markers}
              </MarkerClusterGroup>
              <ClusterRepaintNudge nudgeKey={datasetKey} />
            </>
          ) : markers;
        })()}
      </MapContainer>

      {/* Contrôles hors MapContainer pour éviter les conflits Leaflet */}
      <CountrySelector
        selectedCode={selectedCountryCode}
        onSelect={handleCountrySelect}
        paysList={paysList}
      />
      {addMode && <AddModeBanner isMobile={isMobile} />}
      <AddButton addMode={addMode} onClick={handleAddClick} isMobile={isMobile} />

      {/* Modal de proposition */}
      {modalPosition && (
        <AddDABModal
          position={modalPosition}
          onClose={() => setModalPosition(null)}
          onSuccess={handleSuccess}
          countryCode={selectedCountryCode}
        />
      )}

      {/* Modal modération admin */}
      {adminEditDab && (
        <AdminQuickEditModal
          dab={adminEditDab}
          onClose={() => setAdminEditDab(null)}
          onRefresh={() => { onRefresh?.(); setAdminEditDab(null); }}
        />
      )}
    </div>
  );
}
