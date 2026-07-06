import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ETAT_COLORS = {
  disponible: '#16a34a',
  vide:       '#dc2626',
  en_panne:   '#f59e0b',
  default:    '#2563eb',
};

export default function EmbedPage() {
  const { token } = useParams();
  const mapRef   = useRef(null);
  const mapInst  = useRef(null);
  const layerRef = useRef(null);
  const [banque, setBanque]   = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang] = useState(() =>
    navigator.language?.startsWith('fr') ? 'fr' : 'en'
  );

  const labels = {
    fr: { refresh: 'Actualiser', powered: 'Propulsé par', error: 'Token invalide ou expiré.' },
    en: { refresh: 'Refresh',    powered: 'Powered by',   error: 'Invalid or expired token.' },
  }[lang];

  const renderMarkers = useCallback((dabs) => {
    if (!mapInst.current || !window.L) return;
    if (layerRef.current) layerRef.current.clearLayers();
    const layer = window.L.layerGroup().addTo(mapInst.current);
    layerRef.current = layer;

    if (!dabs.length) return;
    const bounds = [];
    dabs.forEach((dab) => {
      const color = ETAT_COLORS[dab.etat_communautaire] || ETAT_COLORS.default;
      const icon = window.L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = window.L.marker([dab.latitude, dab.longitude], { icon });
      let popup = `<strong>${dab.nom}</strong>`;
      if (dab.adresse) popup += `<br/><small>${dab.adresse}</small>`;
      if (dab.etat_communautaire) {
        const etatLabels = { disponible: '✅ Disponible', vide: '🔴 Vide', en_panne: '⚠️ En panne' };
        popup += `<br/>${etatLabels[dab.etat_communautaire]}`;
      }
      marker.bindPopup(popup);
      layer.addLayer(marker);
      bounds.push([dab.latitude, dab.longitude]);
    });
    if (bounds.length) mapInst.current.fitBounds(bounds, { padding: [30, 30] });
  }, []);

  const loadDabs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/embed/${token}/dabs`);
      const json = await res.json();
      if (!json.success) { setError(labels.error); return; }
      setBanque(json.data.banque);
      renderMarkers(json.data.dabs);
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }, [token, labels.error, renderMarkers]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (!mapRef.current || mapInst.current) return;
      mapInst.current = window.L.map(mapRef.current, { zoomControl: true }).setView([36.7372, 3.0865], 12);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19,
      }).addTo(mapInst.current);
      loadDabs();
    };
    document.head.appendChild(script);

    return () => {
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [token]);

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#dc2626', fontSize:14 }}>
      {error}
    </div>
  );

  return (
    <div style={{ position:'relative', width:'100%', height:'100vh', fontFamily:'sans-serif' }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

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
        <a href="https://mapsdab.com" target="_blank" rel="noopener noreferrer"
          style={{ color:'#2563eb', textDecoration:'none', fontWeight:600 }}>
          {labels.powered} MapsDab
        </a>
      </div>
    </div>
  );
}
