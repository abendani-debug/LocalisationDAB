# Multi-Pays MapsDab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une architecture multi-pays à MapsDab — table `pays` en BDD, `country_code` sur les DABs, sélecteur de pays frontend avec géodétection automatique, et page admin de gestion des pays.

**Architecture:** Une table `pays` (code ISO, nom, bbox, centre carte, is_active) permet d'activer/désactiver des pays sans déploiement de code. Les DABs reçoivent une colonne `country_code`. Le frontend détecte le pays via géoloc + bbox et affiche un sélecteur dropdown. L'admin peut toggler l'activation et déclencher l'import par pays.

**Tech Stack:** Node.js/Express, PostgreSQL (pg), React/Vite, Leaflet.js

---

## Agents & dépendances

```
Agent 1 (Migration BDD)
  └──► Agent 2 (Imports — frImport + osmImport + lancement France)
  └──► Agent 3 (API backend — GET /pays + admin routes)
              └──► Agent 4 (Frontend — CountrySelector + géodétection)
              └──► Agent 5 (Frontend admin — AdminPays.jsx)
```

- **Agents 2 et 3** peuvent tourner en parallèle après Agent 1
- **Agents 4 et 5** peuvent tourner en parallèle après Agent 3

---

## File Map

| Action   | Fichier                                              | Agent | Rôle |
|----------|------------------------------------------------------|-------|------|
| Créer    | `backend/migrations/004_add_pays_table.sql`          | 1     | Table pays + country_code sur dabs + backfill DZ |
| Modifier | `backend/src/utils/frImport.js`                      | 2     | Ajouter country_code='FR' dans INSERT |
| Modifier | `backend/src/utils/osmImport.js`                     | 2     | Ajouter country_code='DZ' dans INSERT |
| Créer    | `backend/src/routes/paysRoutes.js`                   | 3     | GET /api/pays (liste pays actifs publique) |
| Créer    | `backend/src/routes/adminPaysRoutes.js`              | 3     | GET/PATCH/POST admin pays |
| Modifier | `backend/src/app.js`                                 | 3     | Monter paysRoutes + adminPaysRoutes |
| Créer    | `frontend/src/components/UI/CountrySelector.jsx`     | 4     | Dropdown sélection pays |
| Modifier | `frontend/src/components/Map/MapView.jsx`            | 4     | Géodétection pays + centrage carte + intégration CountrySelector |
| Modifier | `frontend/src/api/dabApi.js`                         | 4     | Passer country_code dans les requêtes DABs |
| Créer    | `frontend/src/pages/admin/AdminPays.jsx`             | 5     | Page admin gestion pays |
| Modifier | `frontend/src/App.jsx`                               | 5     | Route /admin/pays |
| Modifier | `frontend/src/pages/admin/AdminDashboard.jsx`        | 5     | Lien vers /admin/pays |

---

## Agent 1 — Migration BDD

**Prérequis :** Être sur la branche `develop`. PostgreSQL local accessible via `DATABASE_URL`.

**Files:**
- Créer : `backend/migrations/004_add_pays_table.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- backend/migrations/004_add_pays_table.sql
-- Ajout de l'architecture multi-pays : table pays + country_code sur dabs.
-- Backfill : tous les DABs existants sont algériens → country_code = 'DZ'.

CREATE TABLE pays (
  id           SERIAL PRIMARY KEY,
  code_iso     CHAR(2)       NOT NULL UNIQUE,
  nom          VARCHAR(100)  NOT NULL,
  center_lat   DECIMAL(9,6)  NOT NULL,
  center_lng   DECIMAL(9,6)  NOT NULL,
  bbox_min_lat DECIMAL(9,6)  NOT NULL,
  bbox_max_lat DECIMAL(9,6)  NOT NULL,
  bbox_min_lng DECIMAL(9,6)  NOT NULL,
  bbox_max_lng DECIMAL(9,6)  NOT NULL,
  default_zoom SMALLINT      NOT NULL DEFAULT 6,
  is_active    BOOLEAN       NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO pays (code_iso, nom, center_lat, center_lng,
  bbox_min_lat, bbox_max_lat, bbox_min_lng, bbox_max_lng,
  default_zoom, is_active)
VALUES
  ('DZ', 'Algérie', 28.0339,  1.6596,
    18.9680, 37.0940, -8.6700, 11.9990, 6, true),
  ('FR', 'France',  46.2276,  2.2137,
    41.3330, 51.1240, -5.1420,  9.5620, 6, true);

ALTER TABLE dabs
  ADD COLUMN country_code CHAR(2) REFERENCES pays(code_iso);

-- Backfill : tous les DABs existants sont en Algérie
UPDATE dabs SET country_code = 'DZ' WHERE country_code IS NULL;

-- Index pour les requêtes de filtrage par pays (toutes les requêtes carte)
CREATE INDEX idx_dabs_country_code ON dabs(country_code);
```

- [ ] **Step 2 : Appliquer la migration en local**

```bash
psql $DATABASE_URL -f backend/migrations/004_add_pays_table.sql
```

Sortie attendue :
```
CREATE TABLE
INSERT 0 2
ALTER TABLE
UPDATE 1124
CREATE INDEX
```
(Le chiffre après UPDATE = nombre de DABs existants, peut être différent)

- [ ] **Step 3 : Vérifier la table pays**

```bash
psql $DATABASE_URL -c "SELECT code_iso, nom, is_active FROM pays ORDER BY code_iso;"
```

Sortie attendue :
```
 code_iso |   nom   | is_active
----------+---------+-----------
 DZ       | Algérie | t
 FR       | France  | t
```

- [ ] **Step 4 : Vérifier le backfill**

```bash
psql $DATABASE_URL -c "SELECT country_code, COUNT(*) FROM dabs GROUP BY country_code;"
```

Sortie attendue : `DZ | <nombre>` — aucune ligne NULL.

- [ ] **Step 5 : Commit**

```bash
git add backend/migrations/004_add_pays_table.sql
git commit -m "feat(db): migration multi-pays — table pays + country_code sur dabs"
```

---

## Agent 2 — Mise à jour des imports

**Prérequis :** Agent 1 complété. Migration appliquée en local.

**Files:**
- Modifier : `backend/src/utils/frImport.js`
- Modifier : `backend/src/utils/osmImport.js`

### Task 2a : frImport.js — ajouter country_code='FR'

- [ ] **Step 1 : Lire le fichier actuel**

Ouvrir `backend/src/utils/frImport.js` et localiser le bloc `db.query` dans la fonction `syncFrancePlaces` (autour de la ligne 363).

- [ ] **Step 2 : Modifier le INSERT pour inclure country_code**

Remplacer le bloc `db.query` existant dans `syncFrancePlaces` :

```js
      const result = await db.query(
        `INSERT INTO dabs (osm_id, nom, adresse, latitude, longitude, statut, type_lieu, source, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'actif', $6, 'google_places', $7)
         ON CONFLICT (osm_id) DO UPDATE SET
           nom        = EXCLUDED.nom,
           adresse    = EXCLUDED.adresse,
           latitude   = EXCLUDED.latitude,
           longitude  = EXCLUDED.longitude,
           type_lieu  = EXCLUDED.type_lieu,
           updated_at = NOW()
         RETURNING (xmax = 0) AS is_insert`,
        [
          `google_${place.place_id}`,
          place.name || 'DAB sans nom',
          place.vicinity || null,
          place.geometry.location.lat,
          place.geometry.location.lng,
          typeLieu,
          isVerified,
        ]
      );
```

Par :

```js
      const result = await db.query(
        `INSERT INTO dabs (osm_id, nom, adresse, latitude, longitude, statut, type_lieu, source, is_verified, country_code)
         VALUES ($1, $2, $3, $4, $5, 'actif', $6, 'google_places', $7, 'FR')
         ON CONFLICT (osm_id) DO UPDATE SET
           nom          = EXCLUDED.nom,
           adresse      = EXCLUDED.adresse,
           latitude     = EXCLUDED.latitude,
           longitude    = EXCLUDED.longitude,
           type_lieu    = EXCLUDED.type_lieu,
           country_code = EXCLUDED.country_code,
           updated_at   = NOW()
         RETURNING (xmax = 0) AS is_insert`,
        [
          `google_${place.place_id}`,
          place.name || 'DAB sans nom',
          place.vicinity || null,
          place.geometry.location.lat,
          place.geometry.location.lng,
          typeLieu,
          isVerified,
        ]
      );
```

- [ ] **Step 3 : Commit**

```bash
git add backend/src/utils/frImport.js
git commit -m "feat(import): frImport — assigner country_code=FR à chaque DAB importé"
```

---

### Task 2b : osmImport.js — ajouter country_code='DZ'

- [ ] **Step 1 : Lire le fichier actuel**

Ouvrir `backend/src/utils/osmImport.js` et localiser le bloc `db.query` dans la boucle d'insertion (chercher `ON CONFLICT (osm_id) DO UPDATE`).

- [ ] **Step 2 : Modifier le INSERT pour inclure country_code**

Localiser la requête d'insertion. Ajouter `country_code` dans la liste des colonnes et `'DZ'` comme valeur, et ajouter `country_code = EXCLUDED.country_code` dans le DO UPDATE.

Le bloc après modification doit ressembler à :

```js
      const result = await db.query(
        `INSERT INTO dabs (osm_id, nom, adresse, latitude, longitude, statut, type_lieu, source, is_verified, country_code)
         VALUES ($1, $2, $3, $4, $5, 'actif', $6, 'google_places', $7, 'DZ')
         ON CONFLICT (osm_id) DO UPDATE SET
           nom          = EXCLUDED.nom,
           adresse      = EXCLUDED.adresse,
           latitude     = EXCLUDED.latitude,
           longitude    = EXCLUDED.longitude,
           type_lieu    = EXCLUDED.type_lieu,
           country_code = EXCLUDED.country_code,
           updated_at   = NOW()
         RETURNING (xmax = 0) AS is_insert`,
        [
          `google_${place.place_id}`,
          place.name || 'DAB sans nom',
          place.vicinity || null,
          place.geometry.location.lat,
          place.geometry.location.lng,
          typeLieu,
          isVerified,
        ]
      );
```

- [ ] **Step 3 : Commit**

```bash
git add backend/src/utils/osmImport.js
git commit -m "feat(import): osmImport — assigner country_code=DZ à chaque DAB importé"
```

---

### Task 2c : Lancer l'import France

- [ ] **Step 1 : Vérifier la clé Google Places**

```bash
grep GOOGLE_PLACES_API_KEY backend/.env
```

Résultat attendu : `GOOGLE_PLACES_API_KEY=AIza...` (non vide).

- [ ] **Step 2 : Lancer l'import**

```bash
cd backend && node -e "require('./src/utils/frImport').syncFrancePlaces().then(r => console.log(JSON.stringify(r, null, 2)))"
```

Durée estimée : 15-30 min. Logs ville par ville dans le terminal.
Sortie attendue (exemple) :
```json
{
  "total": 2800,
  "inserted": 2100,
  "updated": 0,
  "skipped": 220,
  "errors": 0,
  "cities": 60,
  "cleanup": { "deleted": 180, "linked": 1400 }
}
```

Si `errors > 0` → vérifier connexion PostgreSQL et clé API.

- [ ] **Step 3 : Vérifier les DABs français en BDD**

```bash
psql $DATABASE_URL -c "
  SELECT b.nom, COUNT(d.id) AS nb_dabs
  FROM dabs d
  JOIN banques b ON d.banque_id = b.id
  WHERE d.country_code = 'FR'
  GROUP BY b.nom
  ORDER BY nb_dabs DESC
  LIMIT 15;
"
```

Les grandes enseignes françaises (Crédit Agricole, BNP Paribas, SG…) doivent apparaître avec > 50 DABs chacune.

- [ ] **Step 4 : Vérifier la répartition par pays**

```bash
psql $DATABASE_URL -c "SELECT country_code, COUNT(*) FROM dabs GROUP BY country_code ORDER BY country_code;"
```

Sortie attendue :
```
 country_code | count
--------------+-------
 DZ           |  1124
 FR           |  2000+
```

- [ ] **Step 5 : Commit**

```bash
git add .
git commit -m "chore: import France lancé et validé en local"
```

---

## Agent 3 — API Backend pays

**Prérequis :** Agent 1 complété.

**Files:**
- Créer : `backend/src/routes/paysRoutes.js`
- Créer : `backend/src/routes/adminPaysRoutes.js`
- Modifier : `backend/src/app.js`

### Task 3a : Route publique GET /api/pays

- [ ] **Step 1 : Créer paysRoutes.js**

```js
// backend/src/routes/paysRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { successResponse } = require('../utils/responseUtils');

// GET /api/pays — liste des pays actifs (publique)
// Retourne aussi les bbox pour la géodétection côté frontend.
router.get('/', async (req, res) => {
  const result = await db.query(`
    SELECT
      code_iso,
      nom,
      center_lat,
      center_lng,
      bbox_min_lat,
      bbox_max_lat,
      bbox_min_lng,
      bbox_max_lng,
      default_zoom
    FROM pays
    WHERE is_active = true
    ORDER BY nom
  `);
  return successResponse(res, result.rows);
});

module.exports = router;
```

- [ ] **Step 2 : Monter la route dans app.js**

Dans `backend/src/app.js`, après les autres `app.use('/api/...')` :

```js
const paysRoutes = require('./routes/paysRoutes');
// ...
app.use('/api/pays', paysRoutes);
```

- [ ] **Step 3 : Tester**

Démarrer le backend (`cd backend && npm run dev`) puis :

```bash
curl http://localhost:5000/api/pays
```

Sortie attendue :
```json
{
  "success": true,
  "data": [
    {
      "code_iso": "DZ",
      "nom": "Algérie",
      "center_lat": "28.003900",
      "center_lng": "1.659600",
      "bbox_min_lat": "18.968000",
      "bbox_max_lat": "37.094000",
      "bbox_min_lng": "-8.670000",
      "bbox_max_lng": "11.999000",
      "default_zoom": 6
    },
    {
      "code_iso": "FR",
      ...
    }
  ]
}
```

- [ ] **Step 4 : Commit**

```bash
git add backend/src/routes/paysRoutes.js backend/src/app.js
git commit -m "feat(api): route GET /api/pays — liste pays actifs avec bbox"
```

---

### Task 3b : Routes admin pays

- [ ] **Step 1 : Créer adminPaysRoutes.js**

```js
// backend/src/routes/adminPaysRoutes.js
const express        = require('express');
const router         = express.Router();
const db             = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin   = require('../middlewares/roleMiddleware');
const { successResponse, errorResponse } = require('../utils/responseUtils');

// GET /api/admin/pays — liste tous les pays avec stats
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  const result = await db.query(`
    SELECT
      p.code_iso,
      p.nom,
      p.center_lat,
      p.center_lng,
      p.default_zoom,
      p.is_active,
      p.created_at,
      COUNT(d.id)::int      AS nb_dabs,
      MAX(d.updated_at)     AS dernier_import
    FROM pays p
    LEFT JOIN dabs d ON d.country_code = p.code_iso
    GROUP BY p.id
    ORDER BY p.nom
  `);
  return successResponse(res, result.rows);
});

// PATCH /api/admin/pays/:code_iso/toggle — activer/désactiver un pays
router.patch('/:code_iso/toggle', authMiddleware, requireAdmin, async (req, res) => {
  const code = req.params.code_iso.toUpperCase();
  const result = await db.query(
    `UPDATE pays
     SET is_active = NOT is_active
     WHERE code_iso = $1
     RETURNING code_iso, nom, is_active`,
    [code]
  );
  if (!result.rows[0]) return errorResponse(res, 'Pays non trouvé', 404);
  return successResponse(res, result.rows[0]);
});

// POST /api/admin/pays/:code_iso/import — déclencher import pour un pays
router.post('/:code_iso/import', authMiddleware, requireAdmin, async (req, res) => {
  const code = req.params.code_iso.toUpperCase();

  const importFns = {
    DZ: () => require('../utils/osmImport').syncGooglePlaces(),
    FR: () => require('../utils/frImport').syncFrancePlaces(),
  };

  const fn = importFns[code];
  if (!fn) return errorResponse(res, `Import non disponible pour le pays "${code}"`, 400);

  const result = await fn();
  return successResponse(res, result, 200, `Import ${code} terminé.`);
});

module.exports = router;
```

- [ ] **Step 2 : Monter la route dans app.js**

Dans `backend/src/app.js`, après `app.use('/api/pays', paysRoutes)` :

```js
const adminPaysRoutes = require('./routes/adminPaysRoutes');
// ...
app.use('/api/admin/pays', adminPaysRoutes);
```

- [ ] **Step 3 : Tester le toggle**

S'assurer qu'un token admin est disponible, puis :

```bash
curl -X PATCH http://localhost:5000/api/admin/pays/FR/toggle \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

Sortie attendue :
```json
{ "success": true, "data": { "code_iso": "FR", "nom": "France", "is_active": false } }
```

Relancer → `is_active` revient à `true`.

- [ ] **Step 4 : Tester la liste admin**

```bash
curl http://localhost:5000/api/admin/pays \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```

Sortie attendue : tableau avec `nb_dabs` et `dernier_import` pour chaque pays.

- [ ] **Step 5 : Commit**

```bash
git add backend/src/routes/adminPaysRoutes.js backend/src/app.js
git commit -m "feat(api): routes admin pays — liste, toggle actif, import par pays"
```

---

## Agent 4 — Frontend CountrySelector + géodétection

**Prérequis :** Agent 3 complété. Backend tournant sur `http://localhost:5000`.

**Files:**
- Créer : `frontend/src/components/UI/CountrySelector.jsx`
- Modifier : `frontend/src/components/Map/MapView.jsx`
- Modifier : `frontend/src/api/dabApi.js`

### Task 4a : Composant CountrySelector

- [ ] **Step 1 : Créer CountrySelector.jsx**

```jsx
// frontend/src/components/UI/CountrySelector.jsx
import { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';

// Convertit un code ISO 2 lettres en emoji drapeau (ex: 'FR' → '🇫🇷')
const isoToFlag = (code) =>
  [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');

export default function CountrySelector({ selectedCode, onSelect }) {
  const [pays, setPays] = useState([]);

  useEffect(() => {
    axios.get('/pays')
      .then(r => setPays(r.data.data || []))
      .catch(() => {});
  }, []);

  if (pays.length <= 1) return null; // Cacher si un seul pays actif

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      padding: '4px 8px',
    }}>
      <select
        value={selectedCode}
        onChange={e => onSelect(e.target.value)}
        style={{
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        {pays.map(p => (
          <option key={p.code_iso} value={p.code_iso}>
            {isoToFlag(p.code_iso)} {p.nom}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier que le frontend compile sans erreur**

```bash
cd frontend && npm run dev
```

Sortie attendue : `Local: http://localhost:5173/` sans erreur.

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/components/UI/CountrySelector.jsx
git commit -m "feat(frontend): composant CountrySelector — dropdown pays actifs"
```

---

### Task 4b : Géodétection et intégration dans MapView

- [ ] **Step 1 : Lire MapView.jsx en entier**

Lire `frontend/src/components/Map/MapView.jsx` pour comprendre la structure actuelle avant de modifier.

- [ ] **Step 2 : Ajouter la logique de géodétection et le state pays**

Dans `MapView.jsx`, ajouter en haut du composant (après les imports existants) :

```jsx
import CountrySelector from '../UI/CountrySelector';
```

Ajouter dans le composant, après les states existants :

```jsx
const [paysList, setPaysList] = useState([]);
const [selectedCountry, setSelectedCountry] = useState(null);

// Charge les pays actifs au montage
useEffect(() => {
  axios.get('/pays')
    .then(r => {
      const liste = r.data.data || [];
      setPaysList(liste);
      return liste;
    })
    .then(liste => {
      // Géodétection : cherche dans quelle bbox tombe la position de l'utilisateur
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const detected = liste.find(p =>
              coords.latitude  >= parseFloat(p.bbox_min_lat) &&
              coords.latitude  <= parseFloat(p.bbox_max_lat) &&
              coords.longitude >= parseFloat(p.bbox_min_lng) &&
              coords.longitude <= parseFloat(p.bbox_max_lng)
            );
            setSelectedCountry(detected ? detected.code_iso : (liste[0]?.code_iso || 'DZ'));
          },
          () => {
            // Géoloc refusée → pays par défaut = premier pays actif (Algérie)
            setSelectedCountry(liste[0]?.code_iso || 'DZ');
          }
        );
      } else {
        setSelectedCountry(liste[0]?.code_iso || 'DZ');
      }
    })
    .catch(() => setSelectedCountry('DZ'));
}, []);
```

- [ ] **Step 3 : Centrer la carte sur le pays sélectionné**

Ajouter un useEffect qui centre la carte quand `selectedCountry` change.
Localiser la référence à la carte Leaflet dans MapView (généralement `mapRef` ou via `useMap()`).

Ajouter après les useEffects existants :

```jsx
useEffect(() => {
  if (!selectedCountry || !paysList.length) return;
  const pays = paysList.find(p => p.code_iso === selectedCountry);
  if (!pays || !mapRef.current) return;
  mapRef.current.setView(
    [parseFloat(pays.center_lat), parseFloat(pays.center_lng)],
    pays.default_zoom
  );
}, [selectedCountry, paysList]);
```

*(Adapter `mapRef.current` au nom de la ref carte utilisée dans le fichier)*

- [ ] **Step 4 : Ajouter CountrySelector dans le JSX**

Dans le `return` de MapView, à l'intérieur du `<MapContainer>` (ou du div parent de la carte), ajouter :

```jsx
<CountrySelector
  selectedCode={selectedCountry || 'DZ'}
  onSelect={setSelectedCountry}
/>
```

- [ ] **Step 5 : Tester visuellement**

Ouvrir http://localhost:5173. La carte doit :
1. Se centrer automatiquement sur le pays détecté par géoloc
2. Afficher le sélecteur dropdown si plus d'un pays actif
3. Recentrer la carte lors d'un changement de pays dans le dropdown

- [ ] **Step 6 : Commit**

```bash
git add frontend/src/components/Map/MapView.jsx
git commit -m "feat(frontend): géodétection pays + centrage carte + CountrySelector intégré"
```

---

### Task 4c : dabApi — passer country_code dans les requêtes

- [ ] **Step 1 : Lire dabApi.js**

Ouvrir `frontend/src/api/dabApi.js` pour voir la structure des appels actuels.

- [ ] **Step 2 : Vérifier que getDABs accepte déjà des params libres**

La fonction `getDABs` doit ressembler à :
```js
export const getDABs = (params) => api.get('/dabs', { params });
```

Si c'est le cas, aucune modification n'est nécessaire — `country_code` sera passé via les `params` existants.

Si la fonction liste les paramètres explicitement, ajouter `country_code` :
```js
export const getDABs = ({ lat, lng, radius, banque_id, statut, page, limit, country_code } = {}) =>
  api.get('/dabs', { params: { lat, lng, radius, banque_id, statut, page, limit, country_code } });
```

- [ ] **Step 3 : Vérifier que les hooks useDABs passent country_code**

Ouvrir `frontend/src/hooks/useDABs.js`. Si le hook passe des params à `getDABs`, s'assurer que `country_code` peut être transmis depuis le composant parent (MapView).

- [ ] **Step 4 : Commit si modification**

```bash
git add frontend/src/api/dabApi.js frontend/src/hooks/useDABs.js
git commit -m "feat(frontend): dabApi — support paramètre country_code"
```

---

## Agent 5 — Frontend Admin Pays

**Prérequis :** Agent 3 complété.

**Files:**
- Créer : `frontend/src/pages/admin/AdminPays.jsx`
- Modifier : `frontend/src/App.jsx`
- Modifier : `frontend/src/pages/admin/AdminDashboard.jsx`

### Task 5a : Page AdminPays.jsx

- [ ] **Step 1 : Créer AdminPays.jsx**

```jsx
// frontend/src/pages/admin/AdminPays.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axiosConfig';

const isoToFlag = (code) =>
  [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');

export default function AdminPays() {
  const [pays, setPays]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(null); // code_iso en cours d'import

  const fetchPays = () => {
    setLoading(true);
    axios.get('/admin/pays')
      .then(r => setPays(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPays(); }, []);

  const handleToggle = async (code_iso) => {
    await axios.patch(`/admin/pays/${code_iso}/toggle`);
    fetchPays();
  };

  const handleImport = async (code_iso) => {
    if (!window.confirm(`Lancer l'import Google Places pour ${code_iso} ? Cela peut prendre 15-30 min.`)) return;
    setImporting(code_iso);
    try {
      const r = await axios.post(`/admin/pays/${code_iso}/import`);
      alert(`Import ${code_iso} terminé :\n${JSON.stringify(r.data.data, null, 2)}`);
      fetchPays();
    } catch (e) {
      alert(`Erreur import : ${e.response?.data?.message || e.message}`);
    } finally {
      setImporting(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Chargement…</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/admin">← Dashboard</Link>
        <h1 style={{ margin: 0 }}>Gestion des pays</h1>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px' }}>Pays</th>
            <th style={{ padding: '8px 12px' }}>DABs</th>
            <th style={{ padding: '8px 12px' }}>Dernier import</th>
            <th style={{ padding: '8px 12px' }}>Statut</th>
            <th style={{ padding: '8px 12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pays.map(p => (
            <tr key={p.code_iso} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>
                {isoToFlag(p.code_iso)} {p.nom}
                <span style={{ marginLeft: '8px', color: '#9ca3af', fontSize: '12px' }}>
                  {p.code_iso}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>{p.nb_dabs.toLocaleString()}</td>
              <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: '13px' }}>
                {p.dernier_import
                  ? new Date(p.dernier_import).toLocaleDateString('fr-FR')
                  : '—'}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  background: p.is_active ? '#dcfce7' : '#f3f4f6',
                  color: p.is_active ? '#166534' : '#6b7280',
                }}>
                  {p.is_active ? '✅ Actif' : '⏸ Inactif'}
                </span>
              </td>
              <td style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggle(p.code_iso)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                    background: 'white',
                    fontSize: '13px',
                  }}
                >
                  {p.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => handleImport(p.code_iso)}
                  disabled={importing === p.code_iso}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #3b82f6',
                    cursor: importing === p.code_iso ? 'wait' : 'pointer',
                    background: importing === p.code_iso ? '#eff6ff' : '#3b82f6',
                    color: importing === p.code_iso ? '#3b82f6' : 'white',
                    fontSize: '13px',
                  }}
                >
                  {importing === p.code_iso ? 'Import…' : 'Importer'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add frontend/src/pages/admin/AdminPays.jsx
git commit -m "feat(frontend): page admin /admin/pays — liste pays, toggle actif, import"
```

---

### Task 5b : Ajouter la route dans App.jsx

- [ ] **Step 1 : Lire App.jsx**

Ouvrir `frontend/src/App.jsx` pour voir la structure des routes admin existantes.

- [ ] **Step 2 : Ajouter l'import et la route**

Ajouter l'import en haut du fichier (avec les autres imports admin) :

```jsx
import AdminPays from './pages/admin/AdminPays';
```

Ajouter la route dans le bloc des routes admin (après `/admin/propositions` par exemple) :

```jsx
<Route path="/admin/pays" element={<AdminPays />} />
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(frontend): route /admin/pays"
```

---

### Task 5c : Lien depuis AdminDashboard

- [ ] **Step 1 : Lire AdminDashboard.jsx**

Ouvrir `frontend/src/pages/admin/AdminDashboard.jsx` pour voir la structure des liens/cards existants.

- [ ] **Step 2 : Ajouter un lien vers /admin/pays**

Dans la liste des liens/cards du dashboard, ajouter :

```jsx
<Link to="/admin/pays">
  🌍 Gestion des pays
</Link>
```

*(Adapter le style au composant card/lien déjà utilisé dans le dashboard)*

- [ ] **Step 3 : Tester la navigation**

Ouvrir http://localhost:5173/admin → cliquer "Gestion des pays" → vérifier que la page `/admin/pays` s'affiche correctement avec les pays et leurs stats.

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat(frontend): lien Gestion des pays dans AdminDashboard"
```

---

## Validation finale (après tous les agents)

- [ ] **Vérifier la carte** : ouvrir http://localhost:5173, accepter la géoloc → la carte se centre sur le bon pays
- [ ] **Vérifier le sélecteur** : changer de pays → la carte se recentre
- [ ] **Vérifier l'admin** : http://localhost:5173/admin/pays → toggle + stats affichés
- [ ] **Push GitHub**

```bash
git log --oneline -10
git push origin develop
```

- [ ] **Déploiement VPS** (sur demande explicite uniquement)

---

*Plan écrit le 2026-06-12 — spec de référence : `docs/superpowers/specs/2026-06-12-multi-pays-design.md`*
