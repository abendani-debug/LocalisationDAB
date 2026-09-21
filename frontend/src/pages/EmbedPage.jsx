import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DABMarker from '../components/Map/DABMarker';

const API_URL     = import.meta.env.VITE_API_URL || '/api';
const MAPSDAB_URL = 'https://mapsdab.com';
const LIVE_REFRESH_MS = 30000;

function FitBounds({ dabs }) {
  const map = useMap();
  useEffect(() => {
    if (!dabs.length) return;
    const bounds = dabs.map((d) => [parseFloat(d.latitude), parseFloat(d.longitude)]);
    map.fitBounds(bounds, { padding: [30, 30] });
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
