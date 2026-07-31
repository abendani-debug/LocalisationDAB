import { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../../hooks/useIsMobile';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import CountrySelector from '../UI/CountrySelector';
import L from 'leaflet';
import DABMarker from './DABMarker';
import { FlyToPosition, FlyToTarget, LocateButton } from './MapControls';
import AddDABModal from './AddDABModal';
import AdminQuickEditModal from './AdminQuickEditModal';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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

        {dabs.map((dab) => (
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
        ))}
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
