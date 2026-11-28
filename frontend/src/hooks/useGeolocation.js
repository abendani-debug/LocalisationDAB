import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_LAT = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '36.7372');
const DEFAULT_LNG = parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '3.0865');

// Rejeter les positions avec une précision > 50km (IP-géoloc ou Windows Location bug)
const MAX_ACCURACY_METERS = 50000;

// Pendant cette fenêtre après le (re)démarrage du suivi, on ne garde que les
// positions de précision croissante (évite les sursauts pendant le
// préchauffage GPS : IP/WiFi grossier -> GPS précis). Passé ce délai, toute
// nouvelle position valide est acceptée sans condition — sinon l'affichage
// restait figé sur le tout premier bon fix pour le reste de la session :
// se déplacer puis revenir sur l'app sans rafraîchir affichait encore
// l'ancienne position, car un fix normal ultérieur (précision légèrement
// moins bonne que le tout premier) était silencieusement ignoré.
const WARMUP_MS = 20000;

// status : 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export default function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus]     = useState('idle');
  const watchIdRef              = useRef(null);
  const bestAccuracyRef         = useRef(Infinity);
  const warmupUntilRef          = useRef(0);

  const beginWarmup = useCallback(() => {
    bestAccuracyRef.current = Infinity;
    warmupUntilRef.current = Date.now() + WARMUP_MS;
  }, []);

  const applyPosition = useCallback((coords) => {
    setStatus('granted');
    if (coords.accuracy > MAX_ACCURACY_METERS) return; // position trop imprécise, ignorer
    if (Date.now() < warmupUntilRef.current && coords.accuracy >= bestAccuracyRef.current) return;
    bestAccuracyRef.current = coords.accuracy;
    setPosition({
      lat: Math.round(coords.latitude  * 10000) / 10000,
      lng: Math.round(coords.longitude * 10000) / 10000,
    });
  }, []);

  const startWatch = useCallback(() => {
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => applyPosition(coords),
      () => { setStatus('denied'); },
      // maximumAge: 30000 (pas 0) — iOS Safari avec maximumAge:0 + enableHighAccuracy:true
      // ne déclenche aucun callback tant que le GPS n'a pas un fix complet.
      // Avec 30000ms, iOS fournit des positions intermédiaires (IP/WiFi) pendant le
      // préchauffage GPS, ce qui permet de corriger la position dès que le GPS lock.
      { timeout: 30000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, [applyPosition]);

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
        beginWarmup();
        startWatch();
      } else if (result.state === 'denied') {
        setStatus('denied');
      }
      // 'prompt' → rester 'idle', attendre action utilisateur

      result.onchange = () => {
        if (result.state === 'granted') { setStatus('granted'); beginWarmup(); startWatch(); }
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
  }, [startWatch, beginWarmup]);

  // Quand l'utilisateur revient sur l'onglet (ou que l'app reprend la main
  // sur mobile) après l'avoir quittée, redemander immédiatement un point
  // frais plutôt que d'attendre le prochain tick de watchPosition — les
  // navigateurs suspendent ou retardent fortement la géolocalisation en
  // arrière-plan, d'où le symptôme "il faut rafraîchir la page" sans ça.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || status !== 'granted') return;
      beginWarmup();
      navigator.geolocation.getCurrentPosition(
        (pos) => applyPosition(pos.coords),
        () => {},
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
      );
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [status, beginWarmup, applyPosition]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setStatus('unavailable'); return; }
    setStatus('requesting');
    beginWarmup();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords);
        startWatch();
      },
      (err) => {
        // code 1 = PERMISSION_DENIED, code 2 = UNAVAILABLE, code 3 = TIMEOUT
        setStatus(err.code === 1 ? 'denied' : 'unavailable');
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, [startWatch, beginWarmup, applyPosition]);

  const defaultPosition = useRef({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const displayPosition = position || defaultPosition.current;
  const isDefault = status !== 'granted' || position === null;

  return { position: displayPosition, status, isDefault, requestLocation };
}
