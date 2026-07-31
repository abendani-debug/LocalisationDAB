import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const STORAGE_KEY = 'mapsdab_onboarding_done';
const TILE_URL    = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

/* ── Couleurs état marker ──────────────────────────────────────── */
const GREEN   = { color: '#16a34a', halo: '0 0 0 4px rgba(22,163,74,0.30),0 2px 8px rgba(0,0,0,0.25)' };
const ORANGE  = { color: '#ea580c', halo: '0 0 0 4px rgba(234,88,12,0.30),0 2px 8px rgba(0,0,0,0.25)' };
const RED     = { color: '#dc2626', halo: '0 0 0 4px rgba(220,38,38,0.30),0 2px 8px rgba(0,0,0,0.25)' };
const NEUTRAL = { color: '#9ca3af', halo: '0 2px 8px rgba(0,0,0,0.20)' };

/* ── Configurations géographiques ─────────────────────────────── */
const GEO_CONFIGS = {
  FR: {
    center: [48.8738, 2.3465],
    zoom: 16,
    markers: [
      { offset: [ 0.0017,-0.0035], logo:'https://upload.wikimedia.org/wikipedia/commons/8/85/BNP_Paribas_logo.svg',                                                       size:24, s:GREEN   },
      { offset: [-0.0018, 0.0035], logo:'https://upload.wikimedia.org/wikipedia/commons/8/8f/Cr%C3%A9dit_Agricole_2020_logo.svg',                                         size:24, s:GREEN   },
      { offset: [ 0.0022, 0.0045], logo:'https://upload.wikimedia.org/wikipedia/commons/d/d4/Logo_La_Banque_postale_2022.svg',                                            size:24, s:NEUTRAL },
      { offset: [-0.0028,-0.0025], logo:'https://upload.wikimedia.org/wikipedia/commons/c/cd/Logo-SG-Soci%C3%A9t%C3%A9-G%C3%A9n%C3%A9rale.svg',                         size:34, s:ORANGE  },
      { offset: [ 0.0007, 0.0018], logo:'https://upload.wikimedia.org/wikipedia/commons/0/08/Cr%C3%A9dit_Industriel_et_Commercial_Logo.svg',                              size:24, s:RED     },
    ],
  },
  DZ: {
    center: [36.7525, 3.0420],
    zoom: 16,
    markers: [
      { offset: [ 0.0018,-0.0032], logo:'https://upload.wikimedia.org/wikipedia/commons/7/72/AlgeriePoste.svg',                                                           size:24, s:GREEN   },
      { offset: [-0.0015, 0.0038], logo:'https://upload.wikimedia.org/wikipedia/commons/0/0d/Bna-logo.svg',                                                               size:24, s:GREEN   },
      { offset: [ 0.0025, 0.0042], logo:'https://upload.wikimedia.org/wikipedia/fr/e/e9/BEA.svg',                                                                         size:24, s:NEUTRAL },
      { offset: [-0.0022,-0.0028], logo:'https://upload.wikimedia.org/wikipedia/fr/d/dd/Cr%C3%A9dit_populaire_d%27Alg%C3%A9rie_logo.svg',                                size:24, s:ORANGE  },
      { offset: [ 0.0009, 0.0016], logo:'https://upload.wikimedia.org/wikipedia/fr/5/5c/Banque_de_l%E2%80%99agriculture_et_du_d%C3%A9veloppement_rural.svg',              size:24, s:RED     },
    ],
  },
};

/* ── Helper : icône marker banque ─────────────────────────────── */
function bankIcon(logoUrl, logoSize, borderColor, halo) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:44px;height:54px;display:flex;flex-direction:column;align-items:center;animation:ob-pop .5s cubic-bezier(.34,1.56,.64,1) both;transform-origin:bottom center;">
      <div style="width:40px;height:40px;border-radius:50%;background:#fff;border:3px solid ${borderColor};box-shadow:${halo};display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${logoUrl}" width="${logoSize}" height="${logoSize}" style="width:${logoSize}px;height:${logoSize}px;object-fit:contain;display:block;" />
      </div>
      <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid ${borderColor};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div>
    </div>`,
    iconSize: [44, 54], iconAnchor: [22, 54],
  });
}

/* ── Helper : créer une map Leaflet non-interactive ───────────── */
function createMap(el, center, zoom) {
  const map = L.map(el, {
    center, zoom,
    zoomControl:false, attributionControl:false,
    dragging:false, touchZoom:false, doubleClickZoom:false,
    scrollWheelZoom:false, boxZoom:false, keyboard:false,
  });
  L.tileLayer(TILE_URL, { maxZoom:19 }).addTo(map);
  return map;
}

/* ── Composant Dots ───────────────────────────────────────────── */
function Dots({ total, current, onGoTo, activeColor = '#2563eb' }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGoTo(i)}
          style={{
            width: i === current ? 22 : 7,
            height: 7,
            borderRadius: i === current ? 4 : '50%',
            background: i === current ? activeColor : '#d1d5db',
            border: 'none',
            padding: 0,
            transition: 'all .3s',
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
}

/* ── Slide wrapper (cartes 1-3) ───────────────────────────────── */
function SlideWithMap({ mapRef, tag, tagStyle, title, desc, current, index, total, onGoTo, onNext, dotActiveColor, children, t }) {
  const isActive = current === index;
  const whiteGrad = 'linear-gradient(to top,rgba(255,255,255,1) 0%,rgba(255,255,255,.88) 35%,rgba(255,255,255,.3) 58%,transparent 75%)';
  return (
    <div style={{ flex: '0 0 25%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#fff' }}>
      {/* Carte Leaflet */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      {/* Dégradé blanc */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: whiteGrad }} />
      {/* Overlays enfants (card signalement, pin, etc.) */}
      {isActive && children}
      {/* Texte bas */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', padding: '28px 28px 32px', background: 'none' }}>
        <span style={{ display:'inline-block', fontSize:11, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', padding:'4px 10px', borderRadius:20, marginBottom:12, ...tagStyle }}>{tag}</span>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#111827', lineHeight:1.25, marginBottom:8 }}>{title}</h2>
        <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:22 }}>{desc}</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Dots total={total} current={current} onGoTo={onGoTo} activeColor={dotActiveColor || '#2563eb'} />
          <button
            onClick={onNext}
            style={{ background:'linear-gradient(135deg,#3b82f6,#2563eb)', color:'#fff', border:'none', borderRadius:14, padding:'12px 22px', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(37,99,235,.4)', display:'flex', alignItems:'center', gap:6 }}
          >
            {t('onboarding.next')} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Overlay slide 2 : card signalement ──────────────────────── */
function DabCard() {
  return (
    <div style={{
      position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)',
      width:290, background:'#fff', border:'1px solid #e2e8f0', borderRadius:20,
      padding:18, boxShadow:'0 8px 32px rgba(0,0,0,.1)',
      animation:'ob-float-card 3s ease-in-out infinite alternate', zIndex:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💳</div>
        <div>
          <div style={{ color:'#111827', fontSize:14, fontWeight:700 }}>BNP Paribas — Centre-ville</div>
          <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>12 rue de la République</div>
        </div>
      </div>
      {/* Boutons vote */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {[
          { emoji:'✅', label:'Disponible', active:'#f0fdf4', border:'#22c55e' },
          { emoji:'💸', label:'Vide',       active:null,      border:'#e2e8f0' },
          { emoji:'🔧', label:'En panne',   active:null,      border:'#e2e8f0' },
        ].map(({ emoji, label, active, border }) => (
          <div key={label} style={{ flex:1, padding:'10px 4px', borderRadius:12, border:`1.5px solid ${border}`, background: active || '#f8fafc', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:20 }}>{emoji}</span>
            <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>{label}</span>
          </div>
        ))}
      </div>
      {/* Barres votes */}
      {[
        { emoji:'✅', pct:'78%', color:'#22c55e', count:12, delay:'0.4s' },
        { emoji:'💸', pct:'14%', color:'#f59e0b', count:2,  delay:'0.6s' },
        { emoji:'🔧', pct:'7%',  color:'#ef4444', count:1,  delay:'0.8s' },
      ].map(({ emoji, pct, color, count, delay }) => (
        <div key={emoji} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
          <span style={{ fontSize:11, width:24 }}>{emoji}</span>
          <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:pct, background:color, borderRadius:3, animation:`ob-grow-bar 1.5s cubic-bezier(.4,0,.2,1) ${delay} both` }} />
          </div>
          <span style={{ fontSize:11, color:'#94a3b8', width:16 }}>{count}</span>
        </div>
      ))}
      {/* Badge statut */}
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'9px 14px', marginTop:4 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', animation:'ob-blink 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize:13, fontWeight:600, color:'#15803d' }}>Disponible</span>
        <span style={{ fontSize:11, color:'#94a3b8', marginLeft:'auto' }}>il y a 4 min</span>
      </div>
    </div>
  );
}

/* ── Overlay slide 3 : pin + bouton proposer ─────────────────── */
function ProposeOverlay({ t }) {
  return (
    <>
      {/* Hint bulle */}
      <div style={{
        position:'absolute', bottom:'calc(44% + 60px)', left:'50%', transform:'translateX(-50%)',
        zIndex:20, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)',
        color:'rgba(255,255,255,.85)', fontSize:12, fontWeight:500,
        borderRadius:8, padding:'5px 12px', whiteSpace:'nowrap',
      }}>
        {t('onboarding.propose_hint')}
        <span style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'6px solid rgba(0,0,0,.6)' }} />
      </div>
      {/* Bouton Proposer */}
      <button style={{
        position:'absolute', bottom:'44%', left:'50%', transform:'translateX(-50%)',
        zIndex:20, background:'#1e40af', color:'#fff', border:'none',
        borderRadius:999, padding:'14px 28px', fontSize:15, fontWeight:700,
        whiteSpace:'nowrap', cursor:'default',
        animation:'ob-propose-glow 1.8s ease-in-out infinite',
      }}>
        ＋ Proposer
      </button>
      {/* Pin qui tombe */}
      <div style={{
        position:'absolute', top:'32%', left:'50%',
        transform:'translate(-50%,-50%)',
        display:'flex', flexDirection:'column', alignItems:'center',
        animation:'ob-pin-drop .7s cubic-bezier(.34,1.56,.64,1) .5s both', zIndex:10,
      }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* Cercle marqueur réel de l'app */}
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#fff', border:'3px solid #16a34a', boxShadow:'0 0 0 4px rgba(22,163,74,.3),0 2px 8px rgba(0,0,0,.25)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 44 44">
              <rect x="6"  y="22" width="32" height="16" rx="2" fill="#16a34a"/>
              <rect x="10" y="16" width="24" height="8"  rx="2" fill="#16a34a"/>
              <polygon points="22,5 8,16 36,16" fill="#16a34a"/>
              <rect x="10"   y="23" width="7"  height="12" fill="white"/>
              <rect x="18.5" y="23" width="7"  height="12" fill="white"/>
              <rect x="27"   y="23" width="7"  height="12" fill="white"/>
            </svg>
          </div>
          {/* Pointe */}
          <div style={{ width:0, height:0, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'14px solid #16a34a', marginTop:-1, filter:'drop-shadow(0 2px 2px rgba(0,0,0,.2))' }} />
        </div>
        <div style={{ width:16, height:6, background:'rgba(0,0,0,.25)', borderRadius:'50%', marginTop:3, filter:'blur(3px)' }} />
      </div>
      {/* Ripple */}
      <div style={{
        position:'absolute', top:'32%', left:'50%',
        width:60, height:60, borderRadius:'50%',
        border:'2px solid #16a34a',
        animation:'ob-ripple 1.5s ease-out 1.2s infinite',
        zIndex:9,
      }} />
      {/* Card confirmation */}
      <div style={{
        position:'absolute', bottom:'28%', left:'50%',
        animation:'ob-slide-up .5s cubic-bezier(.34,1.56,.64,1) 1.5s both',
        zIndex:10, display:'flex', alignItems:'center', gap:14,
        background:'#fff', border:'1px solid #bbf7d0', borderRadius:20,
        padding:'14px 18px', boxShadow:'0 4px 20px rgba(0,0,0,.08)',
        width: 270,
      }}>
        <div style={{ width:40, height:40, minWidth:40, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700, boxShadow:'0 4px 12px rgba(16,185,129,.4)' }}>✓</div>
        <div>
          <div style={{ color:'#111827', fontSize:13, fontWeight:700 }}>Distributeur ajouté !</div>
          <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>Merci, la carte est mise à jour</div>
        </div>
      </div>
    </>
  );
}

/* ── Slide 4 finale ───────────────────────────────────────────── */
function SlideFinal({ onDone, t }) {
  return (
    <div style={{ flex: '0 0 25%', height:'100%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      {/* Cercles décoratifs bleu pâle */}
      {[
        { w:180, h:180, bottom:'5%',  left:'-40px',  dur:'8s' },
        { w:120, h:120, top:'8%',     right:'-20px', dur:'6s', delay:'-2s' },
        { w:240, h:240, top:'28%',    left:'-80px',  dur:'10s',delay:'-4s' },
        { w:90,  h:90,  bottom:'28%', right:'-10px', dur:'7s', delay:'-1s' },
      ].map((c, i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', background:'#eff6ff', width:c.w, height:c.h, bottom:c.bottom, top:c.top, left:c.left, right:c.right, animation:`ob-float-particle ${c.dur} linear ${c.delay||''} infinite` }} />
      ))}
      {/* Glow central */}
      <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(219,234,254,.8) 0%,transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:'ob-pulse-glow 3s ease-in-out infinite' }} />
      {/* Contenu */}
      <div style={{ position:'relative', zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'0 40px' }}>
        <div style={{ width:96, height:96, borderRadius:28, background:'#eff6ff', border:'1.5px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:28, boxShadow:'0 8px 32px rgba(37,99,235,.12)', animation:'ob-logo-appear .8s cubic-bezier(.34,1.56,.64,1) .2s both' }}>
          <img src="/logo.png" alt="Logo" style={{ width:64, height:64, objectFit:'contain', borderRadius:12 }} />
        </div>
        <h2 style={{ fontSize:36, fontWeight:900, color:'#111827', letterSpacing:'-0.5px', marginBottom:8, animation:'ob-fade-up .6s ease .5s both' }}>Map's DAB</h2>
        <p style={{ fontSize:15, color:'#64748b', lineHeight:1.6, marginBottom:48, maxWidth:240, animation:'ob-fade-up .6s ease .7s both' }}>{t('onboarding.slide4_tagline')}</p>
        <button
          onClick={onDone}
          style={{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none', borderRadius:20, padding:'18px 48px', fontSize:17, fontWeight:800, cursor:'pointer', boxShadow:'0 8px 28px rgba(37,99,235,.35)', animation:'ob-fade-up .6s ease .9s both' }}
        >
          {t('onboarding.start')} →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Composant principal
   ══════════════════════════════════════════════════════════════ */
export default function OnboardingScreen({ onDone }) {
  const { t } = useTranslation();
  const [current, setCurrent]   = useState(0);
  const [geoCode, setGeoCode]   = useState(null);
  const map1Ref = useRef(null);
  const map2Ref = useRef(null);
  const map3Ref = useRef(null);
  const m1 = useRef(null);
  const m2 = useRef(null);
  const m3 = useRef(null);
  const txStart = useRef(0);
  const tyStart = useRef(0);

  /* Détection géo ────────────────────────────────────────────── */
  useEffect(() => {
    const fallback = setTimeout(() => setGeoCode('FR'), 3000);
    if (!navigator.geolocation) { clearTimeout(fallback); setGeoCode('FR'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        clearTimeout(fallback);
        setGeoCode(lat >= 18 && lat <= 38 && lng >= -9 && lng <= 12 ? 'DZ' : 'FR');
      },
      () => { clearTimeout(fallback); setGeoCode('FR'); },
      { timeout: 3000, maximumAge: 60000, enableHighAccuracy: false }
    );
    return () => clearTimeout(fallback);
  }, []);

  /* Init cartes ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!geoCode) return;
    const cfg = GEO_CONFIGS[geoCode];

    // Map 1 — centre exact
    if (map1Ref.current && !m1.current) {
      const map = createMap(map1Ref.current, cfg.center, cfg.zoom);
      m1.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      // Point utilisateur
      L.marker(cfg.center, {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:relative;width:18px;height:18px;">
            <div style="position:absolute;top:50%;left:50%;width:84px;height:84px;border-radius:50%;background:rgba(37,99,235,.1);border:1.5px solid rgba(37,99,235,.25);animation:ob-pulse-ring 2s ease-out .7s infinite;"></div>
            <div style="position:absolute;top:50%;left:50%;width:56px;height:56px;border-radius:50%;background:rgba(37,99,235,.12);border:1.5px solid rgba(37,99,235,.3);animation:ob-pulse-ring 2s ease-out infinite;"></div>
            <div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25);animation:ob-pulse-core 2s ease-in-out infinite;"></div>
          </div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        }),
        interactive: false,
      }).addTo(map);
      // Marqueurs banques
      cfg.markers.forEach(({ offset, logo, size, s }, i) => {
        const pos = [cfg.center[0] + offset[0], cfg.center[1] + offset[1]];
        setTimeout(() => { if (m1.current === map) L.marker(pos, { icon: bankIcon(logo, size, s.color, s.halo), interactive: false }).addTo(map); }, 400 + i * 300);
      });
    }

    // Map 2 — décalé +0.003 lat, -0.004 lng
    if (map2Ref.current && !m2.current) {
      const c2  = [cfg.center[0] + 0.003, cfg.center[1] - 0.004];
      const map = createMap(map2Ref.current, c2, cfg.zoom);
      m2.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      cfg.markers.forEach(({ offset, logo, size, s }, i) => {
        const pos = [c2[0] + offset[0], c2[1] + offset[1]];
        setTimeout(() => { if (m2.current === map) L.marker(pos, { icon: bankIcon(logo, size, s.color, s.halo), interactive: false }).addTo(map); }, 500 + i * 250);
      });
    }

    // Map 3 — décalé -0.004 lat, +0.006 lng, zoom 17
    if (map3Ref.current && !m3.current) {
      const c3  = [cfg.center[0] - 0.004, cfg.center[1] + 0.006];
      const map = createMap(map3Ref.current, c3, 17);
      m3.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      cfg.markers.forEach(({ offset, logo, size, s }, i) => {
        const pos = [c3[0] + offset[0] * 0.8, c3[1] + offset[1] * 0.8];
        setTimeout(() => { if (m3.current === map) L.marker(pos, { icon: bankIcon(logo, size, s.color, s.halo), interactive: false }).addTo(map); }, 400 + i * 250);
      });
    }

    return () => {
      [m1, m2, m3].forEach(ref => { if (ref.current) { ref.current.remove(); ref.current = null; } });
    };
  }, [geoCode]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    onDone();
  }, [onDone]);

  const goTo = useCallback((n) => setCurrent(Math.max(0, Math.min(n, 3))), []);
  const next  = useCallback(() => setCurrent(c => Math.min(c + 1, 3)), []);

  const onTouchStart = useCallback((e) => {
    txStart.current = e.touches[0].clientX;
    tyStart.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e) => {
    const dx = e.changedTouches[0].clientX - txStart.current;
    const dy = e.changedTouches[0].clientY - tyStart.current;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    dx < 0 ? next() : setCurrent(c => Math.max(0, c - 1));
  }, [next]);

  const TOTAL = 4;

  return (
    <>
      {/* Keyframes CSS injectés une seule fois */}
      <style>{`
        @keyframes ob-pop          { from{transform:scale(0) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes ob-pulse-core   { 0%,100%{box-shadow:0 0 0 6px rgba(37,99,235,.25)} 50%{box-shadow:0 0 0 10px rgba(37,99,235,.1)} }
        @keyframes ob-pulse-ring   { 0%{transform:translate(-50%,-50%) scale(.6);opacity:.8} 100%{transform:translate(-50%,-50%) scale(1.4);opacity:0} }
        @keyframes ob-pin-drop     { from{transform:translate(-50%,-200%);opacity:0} to{transform:translate(-50%,-50%);opacity:1} }
        @keyframes ob-ripple       { from{transform:translate(-50%,-50%) scale(.8);opacity:.8} to{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
        @keyframes ob-slide-up     { from{transform:translateX(-50%) translateY(30px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes ob-float-card   { from{transform:translateX(-50%) translateY(0)} to{transform:translateX(-50%) translateY(-8px)} }
        @keyframes ob-blink        { 0%,100%{opacity:1;box-shadow:0 0 0 3px rgba(34,197,94,.3)} 50%{opacity:.5;box-shadow:0 0 0 6px rgba(34,197,94,.1)} }
        @keyframes ob-grow-bar     { from{width:0!important} }
        @keyframes ob-propose-glow { 0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.35),0 0 0 0px rgba(59,130,246,.5)} 50%{box-shadow:0 4px 20px rgba(0,0,0,.4),0 0 0 10px rgba(59,130,246,0)} }
        @keyframes ob-fade-up      { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes ob-logo-appear  { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes ob-float-particle { 0%,100%{transform:translateY(0) rotate(0deg);opacity:1} 50%{transform:translateY(-20px) rotate(180deg);opacity:.6} }
        @keyframes ob-pulse-glow   { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1} 50%{transform:translate(-50%,-50%) scale(1.15);opacity:.6} }
      `}</style>

      {/* Fond overlay desktop */}
      <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center">
        <div
          className="relative bg-white overflow-hidden w-full h-full"
          style={{ maxWidth: 480, maxHeight: '85vh', borderRadius: 'clamp(0px, 3vw, 24px)' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Bouton Passer */}
          {current < 3 && (
            <button
              onClick={() => goTo(3)}
              className="absolute top-12 right-5 z-20 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm"
            >
              {t('onboarding.skip')}
            </button>
          )}

          {/* Track */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${current * 25}%)`, width: `${TOTAL * 100}%` }}
          >
            {/* Slide 1 */}
            <SlideWithMap
              mapRef={map1Ref}
              tag={t('onboarding.slide1_tag')}
              tagStyle={{ background:'rgba(37,99,235,.08)', color:'#1d4ed8', border:'1px solid rgba(37,99,235,.2)' }}
              title={t('onboarding.slide1_title')}
              desc={t('onboarding.slide1_desc')}
              current={current} index={0} total={TOTAL}
              onGoTo={goTo} onNext={next} t={t}
            />

            {/* Slide 2 */}
            <SlideWithMap
              mapRef={map2Ref}
              tag={t('onboarding.slide2_tag')}
              tagStyle={{ background:'rgba(37,99,235,.08)', color:'#1d4ed8', border:'1px solid rgba(37,99,235,.2)' }}
              title={t('onboarding.slide2_title')}
              desc={t('onboarding.slide2_desc')}
              current={current} index={1} total={TOTAL}
              onGoTo={goTo} onNext={next} t={t}
            >
              <DabCard />
            </SlideWithMap>

            {/* Slide 3 */}
            <SlideWithMap
              mapRef={map3Ref}
              tag={t('onboarding.slide3_tag')}
              tagStyle={{ background:'rgba(22,163,74,.12)', color:'#15803d', border:'1px solid rgba(22,163,74,.3)' }}
              title={t('onboarding.slide3_title')}
              desc={t('onboarding.slide3_desc')}
              current={current} index={2} total={TOTAL}
              onGoTo={goTo} onNext={next} t={t}
              dotActiveColor="#16a34a"
            >
              <ProposeOverlay t={t} />
            </SlideWithMap>

            {/* Slide 4 */}
            <SlideFinal onDone={finish} t={t} />
          </div>
        </div>
      </div>
    </>
  );
}
