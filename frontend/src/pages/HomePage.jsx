import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MapView from '../components/Map/MapView';
import DABList from '../components/DAB/DABList';
import DABFilters from '../components/DAB/DABFilters';
import DABDetailModal from '../components/DAB/DABDetailModal';
import useGeolocation from '../hooks/useGeolocation';
import useDABs from '../hooks/useDABs';
import useSocket from '../hooks/useSocket';
import useIsMobile from '../hooks/useIsMobile';
import api from '../api/axiosConfig';

/* ── Détection iOS ──────────────────────────────────────────── */
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

/* ── Écran de permission géolocalisation ────────────────────── */
function LocationPermissionScreen({ status, onAllow, onSkip }) {
  const { t } = useTranslation();
  const requesting = status === 'requesting';
  const denied     = status === 'denied';
  const unavail    = status === 'unavailable';

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-4xl mb-6">
        {denied || unavail ? '🔒' : '📍'}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {denied   ? t('location.blocked')    :
         unavail  ? t('location.unavailable')   :
         requesting ? t('location.searching') :
                     t('location.locate')}
      </h2>

      <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
        {denied ? (
          isIOS
            ? t('location.blocked_ios')
            : t('location.blocked_browser')
        ) : unavail ? (
          t('location.unavailable_detail')
        ) : requesting ? (
          t('location.requesting')
        ) : (
          t('location.explanation')
        )}
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {!denied && !unavail && (
          <button
            onClick={onAllow}
            disabled={requesting}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md active:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {requesting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('location.awaiting')}
              </>
            ) : (
              t('location.allow')
            )}
          </button>
        )}

        {denied && (
          <button
            onClick={onAllow}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md active:bg-blue-700"
          >
            {t('location.retry')}
          </button>
        )}

        <button
          onClick={onSkip}
          disabled={requesting}
          className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-medium text-sm disabled:opacity-40"
        >
          {t('location.skip')}
        </button>
      </div>
    </div>
  );
}

/* ── Bannière position par défaut ───────────────────────────── */
function DefaultPositionBanner({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="absolute top-2 left-2 right-2 z-[600] bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
      <span className="text-base">⚠️</span>
      <p className="text-xs text-amber-700 flex-1">{t('location.default_banner')}</p>
      <button
        onClick={onRetry}
        className="text-xs font-semibold text-blue-600 whitespace-nowrap border border-blue-200 bg-blue-50 rounded-lg px-2 py-1"
      >
        {t('location.activate')}
      </button>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { position, status, isDefault, requestLocation } = useGeolocation();
  const [skipped, setSkipped]             = useState(false);
  const [mapCenter, setMapCenter]         = useState(null);
  const [filters, setFilters]             = useState({ radius: 5 });
  const searchPosition                    = mapCenter || position;

  // ── Multi-pays ────────────────────────────────────────────────
  const [paysList, setPaysList]                       = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState(null);
  const userPosition                                  = isDefault ? null : position;

  useEffect(() => {
    api.get('/pays').then(r => setPaysList(r.data.data || [])).catch(() => {});
  }, []);

  // Auto-détecter le pays depuis la géoloc (une seule fois)
  useEffect(() => {
    if (!userPosition || !paysList.length || selectedCountryCode) return;
    const detected = paysList.find(p =>
      userPosition.lat >= parseFloat(p.bbox_min_lat) &&
      userPosition.lat <= parseFloat(p.bbox_max_lat) &&
      userPosition.lng >= parseFloat(p.bbox_min_lng) &&
      userPosition.lng <= parseFloat(p.bbox_max_lng)
    );
    setSelectedCountryCode(detected ? detected.code_iso : paysList[0].code_iso);
  }, [userPosition, paysList, selectedCountryCode]);
  const { dabs, loading, error, refetch, updateDAB } = useDABs(searchPosition, filters);
  const [panel, setPanel]                 = useState('list');
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [selectedDabId, setSelectedDabId] = useState(null);
  const [highlight, setHighlight]         = useState({ id: null, tick: 0 });
  const [flyTo, setFlyTo]                 = useState(null);
  const lastFliedBanque                   = useRef(null);
  const isMobile                          = useIsMobile();

  // Centrer la carte dès que la position réelle est obtenue
  useEffect(() => {
    if (status === 'granted' && position) {
      setFlyTo({ lat: position.lat, lng: position.lng });
    }
  }, [status, position]);

  useEffect(() => {
    if (!filters.banque_id) { lastFliedBanque.current = null; return; }
    if (loading || dabs.length === 0) return;
    if (lastFliedBanque.current === filters.banque_id) return;
    lastFliedBanque.current = filters.banque_id;
    setFlyTo({ lat: dabs[0].latitude, lng: dabs[0].longitude });
  }, [filters.banque_id, dabs, loading]);

  const handleHighlight = useCallback((id) => {
    setHighlight((prev) => ({ id, tick: prev.tick + 1 }));
    const dab = dabs.find((d) => d.id === id);
    if (dab) setFlyTo({ lat: dab.latitude, lng: dab.longitude });
    if (isMobile) setDrawerOpen(false);
  }, [dabs, isMobile]);

  const handleDabUpdate = useCallback(({ dabId, etatCommunautaire, votes, totalVotes }) => {
    const vote_dominant = !etatCommunautaire && votes && totalVotes > 0
      ? (Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || null)
      : null;
    updateDAB(dabId, { etat_communautaire: etatCommunautaire, nb_votes_actifs: totalVotes, vote_dominant });
  }, [updateDAB]);

  useSocket(handleDabUpdate);

  const handleAllow  = () => requestLocation();
  const handleSkip   = () => setSkipped(true);
  const handleRetry  = () => { setSkipped(false); requestLocation(); };

  // Afficher l'écran de permission si pas encore décidé
  const showPermScreen = !skipped && (
    status === 'idle' || status === 'requesting' || status === 'denied'
  );

  if (showPermScreen) {
    return (
      <LocationPermissionScreen
        status={status}
        onAllow={handleAllow}
        onSkip={handleSkip}
      />
    );
  }

  const showBanner = isDefault && skipped;

  /* ── Desktop ───────────────────────────────────────────────── */
  if (!isMobile) {
    return (
      <div className="flex h-[calc(100vh-56px)]">
        <aside className="w-[340px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
          <div className="flex border-b border-slate-100">
            {['list', 'filters'].map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0
                  ${panel === p
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-gray-700'
                  }`}
              >
                {p === 'list' ? `${t('dab.nearby')} (${dabs.length})` : t('filters.title')}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panel === 'filters'
              ? <DABFilters onFiltersChange={setFilters} countryCode={selectedCountryCode} />
              : <DABList
                  dabs={dabs} loading={loading} error={error}
                  onRetry={refetch} onSelectDAB={setSelectedDabId}
                  onHighlightDAB={handleHighlight}
                />
            }
          </div>
        </aside>

        <div className="flex-1 h-full min-h-0 overflow-hidden relative">
          {showBanner && <DefaultPositionBanner onRetry={handleRetry} />}
          <MapView
            dabs={dabs} userPosition={userPosition}
            onCenterChange={setMapCenter} onSelectDAB={setSelectedDabId}
            highlight={highlight} flyTo={flyTo}
            onRefresh={refetch}
            paysList={paysList}
            selectedCountryCode={selectedCountryCode}
            onCountryChange={setSelectedCountryCode}
          />
        </div>

        {selectedDabId && (
          <DABDetailModal dabId={selectedDabId} onClose={() => setSelectedDabId(null)} />
        )}
      </div>
    );
  }

  /* ── Mobile ────────────────────────────────────────────────── */
  return (
    <div className="relative overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Carte plein écran */}
      <div className="absolute inset-0">
        <MapView
          dabs={dabs} userPosition={userPosition}
          onCenterChange={setMapCenter} onSelectDAB={setSelectedDabId}
          highlight={highlight} flyTo={flyTo}
          onRefresh={refetch}
          paysList={paysList}
          selectedCountryCode={selectedCountryCode}
          onCountryChange={setSelectedCountryCode}
        />
      </div>

      {showBanner && <DefaultPositionBanner onRetry={handleRetry} />}

      {/* Bouton flottant — au-dessus du bouton de localisation (bottom: 5rem + 46px) */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label={t('dab.see_nearby')}
        className="absolute z-[600] bg-blue-600 text-white rounded-full shadow-lg flex flex-col items-center justify-center gap-0.5 active:bg-blue-700 transition-colors"
        style={{ bottom: 'calc(5rem + 54px)', right: '0.75rem', width: '48px', height: '48px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
        </svg>
        <span className="text-[9px] font-bold leading-none">
          {loading ? '…' : dabs.length}
        </span>
      </button>

      {/* Fond semi-transparent — conditionnel */}
      {drawerOpen && (
        <div
          className="absolute inset-0 z-[700] bg-black/30"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Panneau drawer — toujours monté, caché hors-écran quand fermé */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-[800] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] flex flex-col transition-transform duration-300 ease-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ height: '82vh' }}
      >
        {/* En-tête */}
        <div className="flex-shrink-0 flex flex-col items-center px-4 pt-3 pb-2 border-b border-slate-100">
          <div className="w-10 h-1 bg-slate-200 rounded-full mb-3" />
          <div className="flex items-center justify-between w-full">
            <h2 className="text-sm font-semibold text-slate-800">
              {loading ? t('common.loading') : t('dab.nearby_count', { count: dabs.length })}
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-base leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex-shrink-0 border-b border-slate-100">
          <DABFilters onFiltersChange={setFilters} countryCode={selectedCountryCode} />
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <DABList
            dabs={dabs} loading={loading} error={error}
            onRetry={refetch}
            onSelectDAB={(id) => { setDrawerOpen(false); setSelectedDabId(id); }}
            onHighlightDAB={handleHighlight}
          />
        </div>
      </div>

      {selectedDabId && (
        <DABDetailModal dabId={selectedDabId} onClose={() => setSelectedDabId(null)} />
      )}
    </div>
  );
}
