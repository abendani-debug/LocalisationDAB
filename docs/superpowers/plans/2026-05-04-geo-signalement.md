# Géolocalisation obligatoire pour signaler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquer les signalements si l'utilisateur est à plus de 1 km du DAB, avec 4 états d'UI selon le statut GPS.

**Architecture:** Vérification double couche — frontend bloque l'UI selon le statut GPS + distance calculée côté client (Haversine), backend revalide la distance reçue dans le body du POST avant d'enregistrer. `DABDetail` orchestre la géolocalisation et passe les props à `SignalementButton`.

**Tech Stack:** React + useGeolocation (hook existant), express-validator, geoUtils.js (Haversine existant côté backend), react-i18next.

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `frontend/src/utils/formatUtils.js` | Ajouter `haversineKm()` |
| `frontend/src/i18n/locales/fr.json` | Ajouter 4 clés i18n geo |
| `frontend/src/i18n/locales/en.json` | Ajouter 4 clés i18n geo |
| `frontend/src/components/DAB/DABDetail.jsx` | Importer `useGeolocation`, calculer distance, passer props à `SignalementButton` |
| `frontend/src/components/Signalement/SignalementButton.jsx` | Accepter props geo, afficher 4 états |
| `frontend/src/api/signalementApi.js` | Ajouter `userLat`, `userLng` dans le body du POST |
| `backend/src/validators/signalementValidator.js` | Valider `userLat` et `userLng` |
| `backend/src/controllers/signalementController.js` | Vérifier distance ≤ 1 km avant d'enregistrer |

---

### Task 1: Ajouter `haversineKm` dans formatUtils.js

**Files:**
- Modify: `frontend/src/utils/formatUtils.js`

- [ ] **Step 1: Ajouter la fonction à la fin de `formatUtils.js`**

Ajouter ces lignes à la fin du fichier (après `starRating`) :

```js
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
```

- [ ] **Step 2: Vérifier manuellement que la logique est correcte**

Alger → Paris (~1 860 km). Vérification mentale : `haversineKm(36.7372, 3.0865, 48.8566, 2.3522)` doit donner ~1 340 km. Deux points identiques → 0 km.

---

### Task 2: Ajouter les clés i18n pour les états géo

**Files:**
- Modify: `frontend/src/i18n/locales/fr.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Ajouter les clés dans `fr.json`**

Dans le bloc `"signalement": { ... }`, ajouter après `"no_recent"` :

```json
"geo_idle": "Activez la géolocalisation pour signaler l'état de ce DAB",
"geo_activate": "Activer la géolocalisation",
"geo_denied": "Géolocalisation refusée. Autorisez-la dans les paramètres de votre navigateur.",
"geo_too_far": "Vous êtes à {{distance}} de ce DAB. Rapprochez-vous à moins de 1 km pour signaler."
```

- [ ] **Step 2: Ajouter les clés dans `en.json`**

Dans le bloc `"signalement": { ... }`, ajouter après `"no_recent"` :

```json
"geo_idle": "Enable location to report this ATM's status",
"geo_activate": "Enable location",
"geo_denied": "Location denied. Allow it in your browser settings to submit a report.",
"geo_too_far": "You are {{distance}} from this ATM. Get within 1 km to report."
```

---

### Task 3: Mettre à jour `SignalementButton.jsx` — 4 états géo

**Files:**
- Modify: `frontend/src/components/Signalement/SignalementButton.jsx`

Le composant reçoit maintenant 3 nouvelles props :
- `geoStatus` : `'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'`
- `userPosition` : `{ lat, lng } | null` (null si pas encore de fix GPS réel)
- `dabLat`, `dabLng` : coordonnées du DAB
- `requestLocation` : fonction pour déclencher la demande de géoloc

La distance est calculée dans le composant depuis ces props.

- [ ] **Step 1: Remplacer le contenu de `SignalementButton.jsx`**

```jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { submitSignalement } from '../../api/signalementApi';
import { haversineKm, formatDistance } from '../../utils/formatUtils';
import toast from 'react-hot-toast';

const GEO_LIMIT_KM = 1;

export default function SignalementButton({ dabId, onSuccess, geoStatus, userPosition, dabLat, dabLng, requestLocation }) {
  const { t } = useTranslation();
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);

  const ETATS = [
    { key: 'disponible', label: t('signalement.available'), emoji: '✅', border: 'hover:border-green-500',  active: 'border-green-500 bg-green-50' },
    { key: 'vide',       label: t('signalement.empty'),     emoji: '💸', border: 'hover:border-amber-500', active: 'border-amber-500 bg-amber-50' },
    { key: 'en_panne',   label: t('signalement.broken'),    emoji: '🔧', border: 'hover:border-red-500',   active: 'border-red-500   bg-red-50'   },
  ];

  // Calcul distance (null si pas de position réelle)
  const distanceKm = (geoStatus === 'granted' && userPosition)
    ? haversineKm(userPosition.lat, userPosition.lng, dabLat, dabLng)
    : null;

  const tooFar = distanceKm !== null && distanceKm > GEO_LIMIT_KM;

  // --- État : géoloc pas encore demandée ---
  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-500 mb-3">{t('signalement.geo_idle')}</p>
        <button
          onClick={requestLocation}
          disabled={geoStatus === 'requesting'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed font-[inherit]"
        >
          {geoStatus === 'requesting' ? '…' : t('signalement.geo_activate')}
        </button>
      </div>
    );
  }

  // --- État : géoloc refusée ou indisponible ---
  if (geoStatus === 'denied' || geoStatus === 'unavailable') {
    return (
      <div className="rounded-xl border-2 border-dashed border-red-200 p-4 text-center">
        <p className="text-sm text-red-500">{t('signalement.geo_denied')}</p>
      </div>
    );
  }

  // --- État : trop loin ---
  if (tooFar) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-200 p-4 text-center">
        <p className="text-sm text-amber-600">
          {t('signalement.geo_too_far', { distance: formatDistance(distanceKm) })}
        </p>
      </div>
    );
  }

  // --- État normal : à portée ---
  const handleSignal = async (etat) => {
    setSelected(etat);
    setLoading(true);
    try {
      const res = await submitSignalement(dabId, etat, userPosition.lat, userPosition.lng);
      toast.success(t('signalement.success'));
      onSuccess?.(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || t('signalement.error');
      toast.error(msg);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ETATS.map(({ key, label, emoji, border, active }) => (
          <button
            key={key}
            disabled={loading}
            onClick={() => handleSignal(key)}
            className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer bg-white font-[inherit]
              disabled:opacity-60 disabled:cursor-not-allowed
              ${selected === key ? active : `border-slate-200 ${border}`}`}
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-[11px] font-semibold text-gray-700">{label}</div>
          </button>
        ))}
      </div>
      <button
        disabled={!selected || loading}
        onClick={() => selected && handleSignal(selected)}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed font-[inherit]"
      >
        {loading ? t('signalement.sending') : t('signalement.send')}
      </button>
    </div>
  );
}
```

---

### Task 4: Mettre à jour `DABDetail.jsx` — injecter la géolocalisation

**Files:**
- Modify: `frontend/src/components/DAB/DABDetail.jsx`

`DABDetail` reçoit déjà `dab` (qui a `dab.latitude` et `dab.longitude`). On ajoute `useGeolocation` et on passe les props géo à `SignalementButton`.

- [ ] **Step 1: Remplacer le contenu de `DABDetail.jsx`**

```jsx
import { useTranslation } from 'react-i18next';
import { etatColor, formatDate } from '../../utils/formatUtils';
import SignalementBadge from '../Signalement/SignalementBadge';
import SignalementButton from '../Signalement/SignalementButton';
import AvisList from '../Avis/AvisList';
import AvisForm from '../Avis/AvisForm';
import useAuth from '../../hooks/useAuth';
import useGeolocation from '../../hooks/useGeolocation';

const DOT_CLASS = {
  green:  'bg-green-500',
  orange: 'bg-amber-500',
  red:    'bg-red-500',
  gray:   'bg-gray-400',
};

const STATUT_KEY = {
  actif:        'filters.active',
  hors_service: 'filters.out_of_service',
  maintenance:  'filters.maintenance',
};

const ETAT_KEY = {
  disponible: 'signalement.available',
  vide:       'signalement.empty',
  en_panne:   'signalement.broken',
};

export default function DABDetail({ dab, onSignalement }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { position, status, isDefault, requestLocation } = useGeolocation();
  const color = etatColor(dab);

  const statutTrad = STATUT_KEY[dab.statut] ? t(STATUT_KEY[dab.statut]) : dab.statut;
  const etatTrad   = dab.etat_communautaire
    ? (ETAT_KEY[dab.etat_communautaire] ? t(ETAT_KEY[dab.etat_communautaire]) : dab.etat_communautaire)
    : '—';

  // Position GPS réelle uniquement si le statut est 'granted' et qu'on a une position non-default
  const userPosition = (status === 'granted' && !isDefault) ? position : null;

  return (
    <div className="max-w-[680px] mx-auto p-4">
      {/* En-tête */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 ${DOT_CLASS[color] ?? 'bg-gray-400'}`} />
        <div className="min-w-0">
          <h1 className="m-0 text-xl font-bold text-gray-900 leading-snug">{dab.nom}</h1>
          {dab.adresse && (
            <p className="mt-0.5 text-sm text-slate-500">{dab.adresse}</p>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="bg-slate-50 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
        <Info label={t('dab.status_admin')}  value={statutTrad} />
        <Info label={t('dab.state_reported')} value={etatTrad} />
        {dab.banque_nom && <Info label={t('dab.bank')} value={dab.banque_nom} />}
        {dab.etat_communautaire_at && <Info label={t('dab.updated')} value={formatDate(dab.etat_communautaire_at)} />}
        {dab.services?.length > 0 && (
          <Info label={t('dab.services')} value={dab.services.map((s) => s.nom).join(', ')} />
        )}
      </div>

      {/* Signalement communautaire */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
          {t('dab.community_state')}
        </h2>
        <SignalementBadge dabId={dab.id} currentEtat={dab.etat_communautaire} />
        <div className="mt-3">
          <SignalementButton
            dabId={dab.id}
            onSuccess={onSignalement}
            geoStatus={status}
            userPosition={userPosition}
            dabLat={parseFloat(dab.latitude)}
            dabLng={parseFloat(dab.longitude)}
            requestLocation={requestLocation}
          />
        </div>
      </section>

      {/* Avis */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
          {t('dab.user_reviews')}
        </h2>
        {isAuthenticated && <AvisForm dabId={dab.id} onSuccess={() => {}} />}
        <AvisList dabId={dab.id} />
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="m-0 text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}
```

---

### Task 5: Mettre à jour `signalementApi.js` — passer les coordonnées

**Files:**
- Modify: `frontend/src/api/signalementApi.js`

- [ ] **Step 1: Ajouter `userLat` et `userLng` au POST**

Remplacer le contenu du fichier :

```js
import { v4 as uuidv4 } from 'uuid';
import api from './axiosConfig';

const getCookieId = () => {
  let id = localStorage.getItem('dab_cookie_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('dab_cookie_id', id);
  }
  return id;
};

export const getSignalements = (dabId) =>
  api.get(`/dabs/${dabId}/signalements`).then((r) => r.data);

export const submitSignalement = (dabId, etat, userLat, userLng) =>
  api
    .post(`/dabs/${dabId}/signalements`, { etat, cookieId: getCookieId(), userLat, userLng })
    .then((r) => r.data);

export const resoudreSignalements = (dabId) =>
  api.post(`/dabs/${dabId}/signalements/resoudre`).then((r) => r.data);
```

---

### Task 6: Mettre à jour `signalementValidator.js` — valider les coordonnées

**Files:**
- Modify: `backend/src/validators/signalementValidator.js`

- [ ] **Step 1: Remplacer le contenu du fichier**

```js
const { body } = require('express-validator');

const signalementValidator = [
  body('etat')
    .notEmpty().withMessage('L\'état est requis.')
    .isIn(['disponible', 'vide', 'en_panne']).withMessage('État invalide. Valeurs : disponible, vide, en_panne.'),
  body('cookieId')
    .notEmpty().withMessage('Le cookieId est requis.')
    .isUUID().withMessage('cookieId doit être un UUID valide.'),
  body('userLat')
    .notEmpty().withMessage('La latitude utilisateur est requise.')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide (entre -90 et 90).'),
  body('userLng')
    .notEmpty().withMessage('La longitude utilisateur est requise.')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide (entre -180 et 180).'),
];

module.exports = { signalementValidator };
```

---

### Task 7: Mettre à jour `signalementController.js` — vérifier la distance

**Files:**
- Modify: `backend/src/controllers/signalementController.js`

- [ ] **Step 1: Remplacer le contenu du fichier**

```js
require('express-async-errors');
const crypto = require('crypto');
const Signalement = require('../models/Signalement');
const DAB = require('../models/DAB');
const HistoriqueStatut = require('../models/HistoriqueStatut');
const { getIO } = require('../config/socket');
const { env } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { haversineDistance } = require('../utils/geoUtils');

const GEO_LIMIT_KM = 1;

const hashIP = (ip) =>
  crypto.createHmac('sha256', env.IP_SALT).update(ip).digest('hex');

const buildVotesMap = (rows) => {
  const votes = { disponible: 0, vide: 0, en_panne: 0 };
  rows.forEach(({ etat, count }) => { votes[etat] = count; });
  return votes;
};

const determineEtat = (votes, seuil) => {
  for (const [etat, count] of Object.entries(votes)) {
    if (count >= seuil) return etat;
  }
  return null;
};

const getSignalements = async (req, res) => {
  const { id: dabId } = req.params;
  const result = await Signalement.getActiveVotes(dabId);
  const votes = buildVotesMap(result.rows);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  return successResponse(res, { votes, totalVotes: total });
};

const create = async (req, res) => {
  const { id: dabId } = req.params;
  const { etat, cookieId, userLat, userLng } = req.body;

  const dab = await DAB.findById(dabId);
  if (!dab.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  // Vérification distance utilisateur ↔ DAB
  const dabRow = dab.rows[0];
  const distanceKm = haversineDistance(
    parseFloat(userLat),
    parseFloat(userLng),
    parseFloat(dabRow.latitude),
    parseFloat(dabRow.longitude),
  );
  if (distanceKm > GEO_LIMIT_KM) {
    return errorResponse(res, `Vous êtes trop loin de ce DAB (${distanceKm.toFixed(2)} km). Rapprochez-vous à moins de ${GEO_LIMIT_KM} km.`, 403);
  }

  const rawIP = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const ipHash = hashIP(rawIP);

  const existing = await Signalement.findExisting(dabId, ipHash, cookieId);
  if (existing.rows.length) {
    return errorResponse(res, 'Vous avez déjà signalé ce DAB récemment.', 429);
  }

  await Signalement.create(dabId, etat, ipHash, cookieId);

  const votesResult = await Signalement.getActiveVotes(dabId);
  const votes = buildVotesMap(votesResult.rows);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const nouvelEtat = determineEtat(votes, env.SIGNALEMENT_SEUIL);
  const ancienEtat = dabRow.etat_communautaire;

  if (nouvelEtat && nouvelEtat !== ancienEtat) {
    await DAB.updateEtatCommunautaire(dabId, nouvelEtat);
    await HistoriqueStatut.create(dabId, 'etat_communautaire', ancienEtat, nouvelEtat, 'communaute');
    getIO().to(`dab_${dabId}`).emit('dab_statut_change', { dabId: +dabId, etatCommunautaire: nouvelEtat, source: 'communaute', timestamp: new Date().toISOString() });
  }

  await DAB.updateNbVotes(dabId, total);

  getIO().emit('dab_update', {
    dabId: +dabId,
    etatCommunautaire: nouvelEtat || ancienEtat,
    votes,
    totalVotes: total,
    timestamp: new Date().toISOString(),
  });

  return successResponse(res, {
    votes,
    etatCommunautaire: nouvelEtat || ancienEtat,
    totalVotes: total,
  }, 201, 'Signalement enregistré.');
};

const resoudre = async (req, res) => {
  const { id: dabId } = req.params;
  const dab = await DAB.findById(dabId);
  if (!dab.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  const ancienEtat = dab.rows[0].etat_communautaire;
  await DAB.updateEtatCommunautaire(dabId, null);
  await DAB.updateNbVotes(dabId, 0);
  await HistoriqueStatut.create(dabId, 'etat_communautaire', ancienEtat, null, 'admin', req.user.id);

  getIO().emit('dab_update', { dabId: +dabId, etatCommunautaire: null, votes: { disponible: 0, vide: 0, en_panne: 0 }, totalVotes: 0, timestamp: new Date().toISOString() });

  return successResponse(res, null, 200, 'Signalements résolus.');
};

module.exports = { getSignalements, create, resoudre };
```

---

### Task 8: Commit final

**Files:** tous les fichiers modifiés ci-dessus

- [ ] **Step 1: Vérifier qu'on est sur `develop`**

```bash
git branch
```

Expected : `* develop`

- [ ] **Step 2: Stager et commiter**

```bash
git add frontend/src/utils/formatUtils.js \
        frontend/src/i18n/locales/fr.json \
        frontend/src/i18n/locales/en.json \
        frontend/src/components/Signalement/SignalementButton.jsx \
        frontend/src/components/DAB/DABDetail.jsx \
        frontend/src/api/signalementApi.js \
        backend/src/validators/signalementValidator.js \
        backend/src/controllers/signalementController.js

git commit -m "feat(signalement): require user to be within 1km to report DAB status"
```

- [ ] **Step 3: Push vers develop**

```bash
git push origin develop
```
