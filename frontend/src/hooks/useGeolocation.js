import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_LAT = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '36.7372');
const DEFAULT_LNG = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '3.0865');

// Rejeter les positions avec une précision > 50km (IP-géoloc ou Windows Location bug)
const MAX_ACCURACY_METERS = 50000;

// status : 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus]     = useState('idle');
  const watchIdRef              = useRef(null);
  const bestAccuracyRef         = useRef(Infinity);

  const startWatch = useCallback(() => {
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setStatus('granted');
        if (coords.accuracy > MAX_ACCURACY_METERS) return; // position trop imprécise, ignorer
        if (coords.accuracy < bestAccuracyRef.current) {
          bestAccuracyRef.current = coords.accuracy;
          setPosition({
            lat: Math.round(coords.latitude  * 10000) / 10000,
            lng: Math.round(coords.longitude * 10000) / 10000,
          });
        }
      },
      () => { setStatus('denied'); },
      // maximumAge: 30000 (pas 0) — iOS Safari avec maximumAge:0 + enableHighAccuracy:true
      // ne déclenche aucun callback tant que le GPS n'a pas un fix complet.
      // Avec 30000ms, iOS fournit des positions intermédiaires (IP/WiFi) pendant le
      // préchauffage GPS, ce qui permet de corriger la position dès que le GPS lock.
      { timeout: 30000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, []);

  // Au montage : vérifier si permission déjà accordée
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    if (!navigator.permissions) return; // Pas d'API permissions → rester 'idle'

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        setStatus('granted');
        startWatch();
      } else if (result.state === 'denied') {
        setStatus('denied');
      }
      // 'prompt' → rester 'idle', attendre action utilisateur

      result.onchange = () => {
        if (result.state === 'granted') { setStatus('granted'); startWatch(); }
        if (result.state === 'denied')  { setStatus('denied'); }
      };
    }).catch(() => {
      // Permissions API non supportée → rester 'idle'
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startWatch]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setStatus('unavailable'); return; }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('granted');
        if (pos.coords.accuracy <= MAX_ACCURACY_METERS) {
          bestAccuracyRef.current = pos.coords.accuracy;
          setPosition({
            lat: Math.round(pos.coords.latitude  * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
          });
        }
        startWatch();
      },
      (err) => {
        // code 1 = PERMISSION_DENIED, code 2 = UNAVAILABLE, code 3 = TIMEOUT
        setStatus(err.code === 1 ? 'denied' : 'unavailable');
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, [startWatch]);

  const defaultPosition = useRef({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const displayPosition = position || defaultPosition.current;
  const isDefault = status !== 'granted' || position === null;

  return { position: displayPosition, status, isDefault, requestLocation };
}
