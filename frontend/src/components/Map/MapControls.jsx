import { useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';

export function FlyToTarget({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    try {
      map.flyTo([target.lat, target.lng], 15, { animate: true, duration: 1.2 });
    } catch (_) {}
  }, [map, target]);
  return null;
}

export function FlyToPosition({ position }) {
  const map = useMap();
  const hasFlownRef = useRef(false);

  // Une seule fois : position vient de watchPosition (useGeolocation), qui
  // émet un nouvel objet à chaque amélioration de précision GPS. Sans ce
  // garde-fou, la carte se recentrait de force à chaque mise à jour et
  // annulait tout pan/zoom manuel de l'utilisateur.
  useEffect(() => {
    if (!map || !position || hasFlownRef.current) return;
    hasFlownRef.current = true;
    try {
      map.flyTo([position.lat, position.lng], 14, { animate: true, duration: 1.5 });
    } catch (_) {
      // carte pas encore prête
    }
  }, [map, position]);

  return null;
}

export function LocateButton({ position }) {
  const map = useMap();
  if (!position) return null;
  return (
    <div style={{ position: 'absolute', bottom: '5rem', right: '0.75rem', zIndex: 1000 }}>
      <button
        onClick={() => map.flyTo([position.lat, position.lng], 15)}
        title="Ma position"
        style={{
          width: '44px', height: '44px', background: '#fff',
          border: '2px solid rgba(0,0,0,0.2)', borderRadius: '8px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', padding: '4px',
        }}
      >
        <img src="/maps_target.png" alt="Ma position" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </button>
    </div>
  );
}
