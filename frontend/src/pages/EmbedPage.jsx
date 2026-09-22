import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import DABMarker from '../components/Map/DABMarker';
import { getBankConfig } from '../utils/bankConfig';

const API_URL     = import.meta.env.VITE_API_URL || '/api';
const MAPSDAB_URL = 'https://mapsdab.com';
const LIVE_REFRESH_MS = 30000;

// Icône de cluster : logo de la banque du widget + badge du nombre de DAB
// regroupés, à la place des bulles colorées génériques de leaflet.markercluster.
function makeClusterIconFactory(bankCfg) {
  return (cluster) => {
    const count = cluster.getChildCount();
    const badgeColor = count < 10 ? '#16a34a' : count < 100 ? '#f59e0b' : '#dc2626';
    const size = 46;

    const logoOrAbbr = bankCfg?.logoUrl
      ? `<img src="${bankCfg.logoUrl}" width="28" height="28"
           style="width:28px;height:28px;object-fit:contain;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
         <span style="display:none;width:28px;height:28px;align-items:center;justify-content:center;
           font-size:10px;font-weight:900;color:${bankCfg?.text || '#334155'};">${bankCfg?.abbr || ''}</span>`
      : `<span style="font-size:11px;font-weight:900;color:#334155;">${bankCfg?.abbr || '🏧'}</span>`;

    const html = `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:#fff;border:3px solid #2563eb;
          box-shadow:0 2px 10px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;overflow:hidden;
        ">${logoOrAbbr}</div>
        <div style="
          position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 5px;
          border-radius:11px;background:${badgeColor};color:#fff;
          font-size:11px;font-weight:800;font-family:sans-serif;
          display:flex;align-items:center;justify-content:center;
          border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);
        ">${count}</div>
      </div>`;

    return L.divIcon({ html, className: '', iconSize: L.point(size, size) });
  };
}

function FitBounds({ dabs }) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    // Uniquement au premier chargement — sinon chaque rafraîchissement auto
    // (toutes les LIVE_REFRESH_MS) recentrerait la carte et annulerait le
    // zoom/pan de la banque en pleine consultation.
    if (hasFitted.current || !dabs.length) return;
    const bounds = dabs.map((d) => [parseFloat(d.latitude), parseFloat(d.longitude)]);
    map.fitBounds(bounds, { padding: [30, 30] });
    hasFitted.current = true;
  }, [dabs, map]);
  return null;
}

export default function EmbedPage() {
  const { token } = useParams();
  const [banque, setBanque]   = useState(null);
  const [dabs, setDabs]       = useState([]);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang] = useState(() =>
    navigator.language?.startsWith('fr') ? 'fr' : 'en'
  );

  const labels = {
    fr: { refresh: 'Actualiser', powered: 'Propulsé par', error: 'Token invalide ou expiré.' },
    en: { refresh: 'Refresh',    powered: 'Powered by',   error: 'Invalid or expired token.' },
  }[lang];

  const bankCfg = useMemo(() => getBankConfig(banque?.nom), [banque?.nom]);
  const clusterIconFn = useMemo(() => makeClusterIconFactory(bankCfg), [bankCfg]);

  const loadDabs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/embed/${token}/dabs`);
      const json = await res.json();
      if (!json.success) { setError(labels.error); return; }
      setBanque(json.data.banque);
      setDabs(json.data.dabs);
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }, [token, labels.error]);

  useEffect(() => { loadDabs(); }, [loadDabs]);

  // Rafraîchissement automatique — remonte les signalements faits sur MapsDab
  // sans que la banque ait à cliquer sur "Actualiser".
  useEffect(() => {
    const interval = setInterval(loadDabs, LIVE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadDabs]);

  // Ouvre la fiche DAB sur mapsdab.com dans un nouvel onglet
  const handleSelectDAB = (dabId) => {
    window.open(`${MAPSDAB_URL}/?dab=${dabId}`, '_blank', 'noopener,noreferrer');
  };

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#dc2626', fontSize:14 }}>
      {error}
    </div>
  );

  return (
    <div style={{ position:'relative', width:'100%', height:'100vh', fontFamily:'sans-serif' }}>
      <MapContainer
        center={[36.7372, 3.0865]}
        zoom={12}
        style={{ width:'100%', height:'100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url="https://mt{s}.google.com/vt/lyrs=m&hl=fr&x={x}&y={y}&z={z}"
          subdomains="0123"
          maxZoom={20}
        />

        {banque && (
          <MarkerClusterGroup key={banque.nom} chunkedLoading iconCreateFunction={clusterIconFn}>
            {dabs.map((dab) => (
              <DABMarker
                key={dab.id}
                dab={dab}
                userPosition={null}
                onSelectDAB={handleSelectDAB}
                highlightTick={null}
                isActive={false}
                isAdmin={false}
              />
            ))}
          </MarkerClusterGroup>
        )}

        <FitBounds dabs={dabs} />
      </MapContainer>

      <button
        onClick={loadDabs}
        disabled={loading}
        style={{
          position:'absolute', top:10, right:10, zIndex:1000,
          background:'#fff', border:'1px solid #d1d5db',
          borderRadius:6, padding:'6px 12px', fontSize:12,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '...' : `↻ ${labels.refresh}`}
      </button>

      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:1000,
        background:'rgba(255,255,255,0.92)', borderTop:'1px solid #e5e7eb',
        padding:'6px 12px', display:'flex', justifyContent:'space-between',
        alignItems:'center', fontSize:11, color:'#6b7280',
      }}>
        <span>{banque?.nom || ''}</span>
        <a href={MAPSDAB_URL} target="_blank" rel="noopener noreferrer"
          style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>
          {labels.powered} MapsDab
        </a>
      </div>
    </div>
  );
}
