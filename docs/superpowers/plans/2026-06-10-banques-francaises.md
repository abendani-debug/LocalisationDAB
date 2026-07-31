# Intégration Banques Françaises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter toutes les banques françaises disposant de DABs publics dans MapsDab — migration SQL, import Google Places ~60 villes, logos/couleurs dans bankConfig.js, branchement dans le cron et la route admin.

**Architecture:** Nouveau fichier `frImport.js` calqué sur `osmImport.js` avec ~60 villes françaises (préfectures + grandes agglomérations) et règles de cleanup propres aux banques françaises. Une fonction `syncAll()` exportée depuis `osmImport.js` orchestre l'import Algérie puis France en séquence. Les banques françaises sont ajoutées dans la table `banques` via une migration SQL et leurs identités visuelles dans `bankConfig.js` côté frontend.

**Tech Stack:** Node.js, PostgreSQL (pg), Google Places API, React/Vite

---

## File Map

| Action   | Fichier                                         | Rôle |
|----------|-------------------------------------------------|------|
| Créer    | `backend/migrations/003_add_french_banks.sql`   | Insère les nouvelles banques françaises dans `banques` |
| Créer    | `backend/src/utils/frImport.js`                 | Import Google Places ~60 villes + cleanup SQL FR |
| Modifier | `backend/src/utils/osmImport.js`                | Ajouter + exporter `syncAll()` |
| Modifier | `backend/src/app.js`                            | Route admin + cron utilisent `syncAll()` |
| Modifier | `frontend/src/utils/bankConfig.js`              | 9 banques françaises avec couleurs + logos |

---

### Task 1 : Migration SQL — banques françaises

**Files:**
- Create: `backend/migrations/003_add_french_banks.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- 003_add_french_banks.sql
-- Ajout des banques françaises disposant de distributeurs publics.
-- BNP Paribas et Société Générale existent déjà sous leur nom algérien
-- (BNP Paribas El Djazaïr / Société Générale Algérie).
-- On crée ici leurs entités françaises + les banques exclusivement françaises.

INSERT INTO banques (nom, logo_url) VALUES
  ('BNP Paribas',           'https://upload.wikimedia.org/wikipedia/commons/8/85/BNP_Paribas_logo.svg'),
  ('Société Générale',      'https://upload.wikimedia.org/wikipedia/commons/c/cd/Logo-SG-Soci%C3%A9t%C3%A9-G%C3%A9n%C3%A9rale.svg'),
  ('Crédit Agricole',       'https://upload.wikimedia.org/wikipedia/commons/1/1d/Logo_Cr%C3%A9dit_Agricole.svg'),
  ('LCL',                   'https://upload.wikimedia.org/wikipedia/commons/a/a8/LCL_logo_2019.svg'),
  ('La Banque Postale',     'https://upload.wikimedia.org/wikipedia/commons/5/54/La_Banque_Postale.svg'),
  ('CIC',                   'https://upload.wikimedia.org/wikipedia/commons/5/5e/CIC_logo_2021.svg'),
  ('Crédit Mutuel',         'https://upload.wikimedia.org/wikipedia/commons/2/26/Cr%C3%A9dit_Mutuel_logo.svg'),
  ('Banque Populaire',      'https://upload.wikimedia.org/wikipedia/commons/8/82/Banques-populaires-logo.svg'),
  ('Caisse d''Épargne',     'https://upload.wikimedia.org/wikipedia/commons/8/8d/Caisse_d%27%C3%A9pargne_logo.svg'),
  ('HSBC France',           'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg'),
  ('Bred Banque Populaire', NULL)
ON CONFLICT (nom) DO NOTHING;
```

- [ ] **Step 2 : Appliquer la migration en local**

```bash
psql $DATABASE_URL -f backend/migrations/003_add_french_banks.sql
```

Sortie attendue : `INSERT 0 11` (ou moins si certaines existent déjà via ON CONFLICT)

- [ ] **Step 3 : Vérifier**

```bash
psql $DATABASE_URL -c "SELECT id, nom FROM banques ORDER BY id;"
```

Les 11 banques françaises doivent apparaître à la suite des banques algériennes.

- [ ] **Step 4 : Commit**

```bash
git add backend/migrations/003_add_french_banks.sql
git commit -m "feat(db): migration ajout banques françaises"
```

---

### Task 2 : frImport.js — import Google Places France

**Files:**
- Create: `backend/src/utils/frImport.js`

- [ ] **Step 1 : Créer le fichier**

```js
const axios   = require('axios');
const db      = require('../config/db');
const { env } = require('../config/env');

const GOOGLE_PLACES_URL       = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const RADIUS_METERS           = 25000; // 25 km autour de chaque ville
const DELAY_BETWEEN_CITIES_MS = 300;

// Préfectures + grandes agglomérations françaises (~60 villes, rayon 25 km)
// Couvre la France métropolitaine et la Corse.
const FRENCH_CITIES = [
  // Île-de-France (densité élevée → plusieurs points)
  { name: 'Paris Centre',     lat: 48.8566,  lng:  2.3522 },
  { name: 'Paris Nord',       lat: 48.9362,  lng:  2.3569 },
  { name: 'Versailles',       lat: 48.8014,  lng:  2.1301 },
  { name: 'Créteil',          lat: 48.7773,  lng:  2.4578 },
  { name: 'Nanterre',         lat: 48.8924,  lng:  2.2070 },
  // Auvergne-Rhône-Alpes
  { name: 'Lyon',             lat: 45.7640,  lng:  4.8357 },
  { name: 'Grenoble',         lat: 45.1885,  lng:  5.7245 },
  { name: 'Saint-Étienne',    lat: 45.4397,  lng:  4.3872 },
  { name: 'Clermont-Ferrand', lat: 45.7774,  lng:  3.0870 },
  { name: 'Annecy',           lat: 45.8992,  lng:  6.1294 },
  { name: 'Chambéry',         lat: 45.5646,  lng:  5.9178 },
  { name: 'Valence',          lat: 44.9334,  lng:  4.8924 },
  // PACA
  { name: 'Marseille',        lat: 43.2965,  lng:  5.3698 },
  { name: 'Nice',             lat: 43.7102,  lng:  7.2620 },
  { name: 'Toulon',           lat: 43.1242,  lng:  5.9280 },
  { name: 'Aix-en-Provence',  lat: 43.5297,  lng:  5.4474 },
  { name: 'Avignon',          lat: 43.9493,  lng:  4.8055 },
  // Occitanie
  { name: 'Toulouse',         lat: 43.6047,  lng:  1.4442 },
  { name: 'Montpellier',      lat: 43.6108,  lng:  3.8767 },
  { name: 'Nîmes',            lat: 43.8367,  lng:  4.3601 },
  { name: 'Perpignan',        lat: 42.6887,  lng:  2.8948 },
  { name: 'Béziers',          lat: 43.3447,  lng:  3.2153 },
  { name: 'Montauban',        lat: 44.0175,  lng:  1.3529 },
  // Nouvelle-Aquitaine
  { name: 'Bordeaux',         lat: 44.8378,  lng: -0.5792 },
  { name: 'Limoges',          lat: 45.8336,  lng:  1.2611 },
  { name: 'Poitiers',         lat: 46.5802,  lng:  0.3404 },
  { name: 'La Rochelle',      lat: 46.1603,  lng: -1.1511 },
  { name: 'Pau',              lat: 43.2951,  lng: -0.3708 },
  { name: 'Bayonne',          lat: 43.4929,  lng: -1.4748 },
  { name: 'Périgueux',        lat: 45.1837,  lng:  0.7206 },
  // Hauts-de-France
  { name: 'Lille',            lat: 50.6292,  lng:  3.0573 },
  { name: 'Amiens',           lat: 49.8941,  lng:  2.2958 },
  { name: 'Roubaix',          lat: 50.6942,  lng:  3.1746 },
  { name: 'Dunkerque',        lat: 51.0343,  lng:  2.3752 },
  { name: 'Valenciennes',     lat: 50.3572,  lng:  3.5237 },
  { name: 'Calais',           lat: 50.9513,  lng:  1.8587 },
  // Grand Est
  { name: 'Strasbourg',       lat: 48.5734,  lng:  7.7521 },
  { name: 'Reims',            lat: 49.2583,  lng:  4.0317 },
  { name: 'Metz',             lat: 49.1193,  lng:  6.1757 },
  { name: 'Nancy',            lat: 48.6921,  lng:  6.1844 },
  { name: 'Mulhouse',         lat: 47.7508,  lng:  7.3359 },
  { name: 'Colmar',           lat: 48.0793,  lng:  7.3585 },
  { name: 'Troyes',           lat: 48.2973,  lng:  4.0744 },
  // Bretagne
  { name: 'Rennes',           lat: 48.1173,  lng: -1.6778 },
  { name: 'Brest',            lat: 48.3904,  lng: -4.4860 },
  { name: 'Lorient',          lat: 47.7482,  lng: -3.3677 },
  { name: 'Quimper',          lat: 47.9960,  lng: -4.1014 },
  { name: 'Vannes',           lat: 47.6559,  lng: -2.7603 },
  // Pays de la Loire
  { name: 'Nantes',           lat: 47.2184,  lng: -1.5536 },
  { name: 'Angers',           lat: 47.4784,  lng: -0.5632 },
  { name: 'Le Mans',          lat: 48.0061,  lng:  0.1996 },
  { name: 'Saint-Nazaire',    lat: 47.2736,  lng: -2.2137 },
  // Normandie
  { name: 'Rouen',            lat: 49.4432,  lng:  1.0999 },
  { name: 'Caen',             lat: 49.1829,  lng: -0.3707 },
  { name: 'Le Havre',         lat: 49.4938,  lng:  0.1079 },
  { name: 'Cherbourg',        lat: 49.6337,  lng: -1.6228 },
  // Centre-Val de Loire
  { name: 'Orléans',          lat: 47.9029,  lng:  1.9039 },
  { name: 'Tours',            lat: 47.3941,  lng:  0.6848 },
  // Bourgogne-Franche-Comté
  { name: 'Dijon',            lat: 47.3220,  lng:  5.0415 },
  { name: 'Besançon',         lat: 47.2378,  lng:  6.0241 },
  // Corse
  { name: 'Ajaccio',          lat: 41.9192,  lng:  8.7386 },
  { name: 'Bastia',           lat: 42.6976,  lng:  9.4496 },
];

const REJECT_TYPES = new Set([
  'restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery',
  'bakery', 'night_club', 'lodging', 'beauty_salon', 'hair_care',
  'school', 'university', 'hospital', 'doctor', 'dentist',
  'movie_theater', 'amusement_park', 'stadium', 'gym', 'spa',
  'mosque', 'church', 'place_of_worship',
]);

const AMBIGUOUS_TYPES = new Set([
  'supermarket', 'grocery_or_supermarket', 'store', 'clothing_store',
  'convenience_store', 'department_store', 'shopping_mall',
  'gas_station', 'pharmacy', 'drugstore', 'post_office',
  'airport', 'train_station', 'bus_station', 'transit_station',
]);

const classifyATM = (types = []) => {
  if (!types.includes('atm')) return 'reject';
  if (types.some(t => REJECT_TYPES.has(t))) return 'reject';
  if (types.some(t => AMBIGUOUS_TYPES.has(t))) return 'review';
  return 'accept';
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchPage = async (params) => {
  const response = await axios.get(GOOGLE_PLACES_URL, {
    params: { ...params, key: env.GOOGLE_PLACES_API_KEY },
    timeout: 15000,
  });
  return response.data;
};

const fetchAllPlaces = async (lat, lng, type) => {
  const results = [];
  let data = await fetchPage({ location: `${lat},${lng}`, radius: RADIUS_METERS, type });
  results.push(...(data.results || []));
  while (data.next_page_token) {
    await sleep(2000); // Google exige ~2s avant d'utiliser le next_page_token
    data = await fetchPage({ pagetoken: data.next_page_token });
    results.push(...(data.results || []));
  }
  return results;
};

/**
 * Retourne l'id d'une banque par son nom exact dans la table banques.
 * Évite de hardcoder les IDs (qui peuvent différer entre local et prod).
 */
const getBankId = async (nom) => {
  const r = await db.query('SELECT id FROM banques WHERE nom = $1 LIMIT 1', [nom]);
  return r.rows[0]?.id ?? null;
};

/**
 * Supprime les faux ATMs français et lie les DABs aux banques françaises.
 * @returns {{ deleted, linked }}
 */
const cleanupFranceImport = async () => {
  let deleted = 0;
  let linked  = 0;

  // ── Supprimer noms génériques sans banque ────────────────────────────────────
  const delGeneric = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ~* '^(atm|dab|distributeur|distributeur automatique|guichet automatique|banque|bank)$'
      OR nom ~* '^(atm [0-9]+|dab [0-9]+)$'
    )
  `);
  deleted += delGeneric.rowCount;

  // ── Supprimer entités non-ATMs françaises ────────────────────────────────────
  const delFaux = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ILIKE '%bureau de change%'
      OR nom ILIKE '%assurance%' OR nom ILIKE '%mutuelle%'
      OR nom ILIKE '%notaire%'   OR nom ILIKE '%avocat%'
      OR nom ILIKE '%agence immobili%'
      OR nom ILIKE '%impôts%'    OR nom ILIKE '%trésor public%'
      OR nom ILIKE '%pôle emploi%'
      OR nom ILIKE '%caf %'      OR nom ILIKE '%caisse d''allocations%'
      OR nom ILIKE '%cpam%'
      OR nom ILIKE '%mairie%'    OR nom ILIKE '%préfecture%'
    )
  `);
  deleted += delFaux.rowCount;

  // ── Banque de France (banque centrale — pas de DABs publics) ─────────────────
  const delBDF = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ILIKE '%banque de france%' OR nom ILIKE '%banque centrale%'
    )
  `);
  deleted += delBDF.rowCount;

  // ── Récupérer les IDs des banques françaises ─────────────────────────────────
  const bnpId   = await getBankId('BNP Paribas');
  const sgId    = await getBankId('Société Générale');
  const caId    = await getBankId('Crédit Agricole');
  const lclId   = await getBankId('LCL');
  const posteId = await getBankId('La Banque Postale');
  const cicId   = await getBankId('CIC');
  const cmId    = await getBankId('Crédit Mutuel');
  const bredId  = await getBankId('Bred Banque Populaire');
  const bpId    = await getBankId('Banque Populaire');
  const ceId    = await getBankId('Caisse d\'Épargne');
  const hsbcId  = await getBankId('HSBC France');

  const linkBank = async (id, conditions) => {
    if (!id) return;
    const r = await db.query(
      `UPDATE dabs SET banque_id = $1 WHERE banque_id IS NULL AND (${conditions})`,
      [id]
    );
    linked += r.rowCount;
  };

  // BNP Paribas (incl. Hello Bank, filiale BNP)
  await linkBank(bnpId,   `nom ILIKE '%bnp%' OR nom ILIKE '%paribas%' OR nom ILIKE '%hello bank%'`);
  // Société Générale (incl. Crédit du Nord, absorbé en 2023)
  await linkBank(sgId,    `nom ILIKE '%société générale%' OR nom ILIKE '%societe generale%' OR nom = 'SG' OR nom ILIKE '%crédit du nord%' OR nom ILIKE '%credit du nord%'`);
  // Crédit Agricole — matcher avant LCL pour éviter ambiguïté
  await linkBank(caId,    `nom ILIKE '%crédit agricole%' OR nom ILIKE '%credit agricole%' OR nom ILIKE '%caisse régionale%' OR nom ILIKE '%caisse regionale%' OR nom ILIKE '%caisse locale%'`);
  // LCL (filiale Crédit Agricole)
  await linkBank(lclId,   `nom ILIKE '%\mlcl\M%' OR nom ILIKE '%lyonnais%'`);
  // La Banque Postale / La Poste (France uniquement — regex exclut "Algérie Poste")
  await linkBank(posteId, `nom ILIKE '%banque postale%' OR (nom ILIKE '%la poste%' AND nom NOT ILIKE '%algérie%' AND nom NOT ILIKE '%algerie%') OR nom = 'Poste' OR nom = 'LA POSTE'`);
  // CIC
  await linkBank(cicId,   `nom ILIKE '%\mcic\M%' OR nom ILIKE '%crédit industriel%' OR nom ILIKE '%credit industriel%'`);
  // Crédit Mutuel
  await linkBank(cmId,    `nom ILIKE '%crédit mutuel%' OR nom ILIKE '%credit mutuel%'`);
  // Bred (avant Banque Populaire générique)
  await linkBank(bredId,  `nom ILIKE '%bred%'`);
  // Banque Populaire
  await linkBank(bpId,    `nom ILIKE '%banque populaire%'`);
  // Caisse d'Épargne
  await linkBank(ceId,    `nom ILIKE '%caisse d''épargne%' OR nom ILIKE '%caisse d''epargne%'`);
  // HSBC
  await linkBank(hsbcId,  `nom ILIKE '%hsbc%'`);

  return { deleted, linked };
};

/**
 * Importe les DABs et agences pour ~60 villes françaises via Google Places.
 * @returns {{ total, inserted, updated, skipped, errors, cities, cleanup }}
 */
const syncFrancePlaces = async () => {
  const seen   = new Set();
  const places = [];
  let cityErrors = 0;

  for (const city of FRENCH_CITIES) {
    try {
      const [atms, banks] = await Promise.all([
        fetchAllPlaces(city.lat, city.lng, 'atm'),
        fetchAllPlaces(city.lat, city.lng, 'bank'),
      ]);
      await sleep(DELAY_BETWEEN_CITIES_MS);

      for (const p of atms.map(x => ({ ...x, _type: 'atm' }))) {
        if (!seen.has(p.place_id)) { seen.add(p.place_id); places.push(p); }
      }
      for (const p of banks.map(x => ({ ...x, _type: 'bank' }))) {
        if (!seen.has(p.place_id)) { seen.add(p.place_id); places.push(p); }
      }

      console.log(`[import-fr] ${city.name} — atm:${atms.length} bank:${banks.length}`);
    } catch (err) {
      console.error(`[import-fr] Erreur pour ${city.name}:`, err.message);
      cityErrors++;
    }
  }

  console.log(`[import-fr] ${places.length} lieux uniques — insertion en cours…`);

  let inserted = 0, updated = 0, skipped = 0, errors = 0;

  for (const place of places) {
    try {
      const typeLieu = place._type === 'bank' ? 'agence' : 'atm';
      let isVerified = true;

      if (place._type === 'atm') {
        const classification = classifyATM(place.types || []);
        if (classification === 'reject') { skipped++; continue; }
        if (classification === 'review') isVerified = false;
      }

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
      if (result.rows[0]?.is_insert) inserted++;
      else updated++;
    } catch (err) {
      if (errors === 0) console.error('[import-fr] Première erreur SQL :', err.message);
      errors++;
    }
  }

  console.log(`[import-fr] terminé — inserted:${inserted} updated:${updated} skipped:${skipped} errors:${errors}`);
  console.log('[import-fr] Nettoyage France en cours…');

  const { deleted, linked } = await cleanupFranceImport();
  console.log(`[import-fr] Nettoyage terminé — supprimés:${deleted} liés:${linked}`);

  return {
    total: places.length,
    inserted,
    updated,
    skipped,
    errors,
    cities: FRENCH_CITIES.length - cityErrors,
    cleanup: { deleted, linked },
  };
};

module.exports = { syncFrancePlaces, cleanupFranceImport };
```

- [ ] **Step 2 : Commit**

```bash
git add backend/src/utils/frImport.js
git commit -m "feat(import): frImport.js — 60 villes françaises + cleanup banques FR"
```

---

### Task 3 : osmImport.js — ajouter et exporter syncAll()

**Files:**
- Modify: `backend/src/utils/osmImport.js` (dernière ligne uniquement)

- [ ] **Step 1 : Remplacer la dernière ligne de osmImport.js**

Remplacer :
```js
module.exports = { syncGooglePlaces, cleanupAfterImport };
```

Par :
```js
const { syncFrancePlaces } = require('./frImport');

/**
 * Import complet Algérie + France en séquence.
 * @returns {{ algerie, france }}
 */
const syncAll = async () => {
  console.log('[syncAll] Démarrage import Algérie…');
  const dz = await syncGooglePlaces();
  console.log('[syncAll] Import Algérie terminé. Démarrage import France…');
  const fr = await syncFrancePlaces();
  console.log('[syncAll] Import France terminé.');
  return { algerie: dz, france: fr };
};

module.exports = { syncGooglePlaces, cleanupAfterImport, syncAll };
```

- [ ] **Step 2 : Commit**

```bash
git add backend/src/utils/osmImport.js
git commit -m "feat(import): syncAll() — enchaîne import Algérie + France"
```

---

### Task 4 : app.js — brancher syncAll()

**Files:**
- Modify: `backend/src/app.js`

- [ ] **Step 1 : Mettre à jour le require en haut du fichier**

Remplacer :
```js
const { syncGooglePlaces } = require('./utils/osmImport');
```
Par :
```js
const { syncAll } = require('./utils/osmImport');
```

- [ ] **Step 2 : Mettre à jour la route admin**

Remplacer :
```js
app.post('/api/admin/import-google', authMiddleware, requireAdmin, async (req, res) => {
  const result = await syncGooglePlaces();
  return successResponse(res, result, 200, 'Import Google Places terminé.');
});
```
Par :
```js
app.post('/api/admin/import-google', authMiddleware, requireAdmin, async (req, res) => {
  const result = await syncAll();
  return successResponse(res, result, 200, 'Import Google Places terminé (Algérie + France).');
});
```

- [ ] **Step 3 : Mettre à jour le cron**

Remplacer dans le callback du cron :
```js
    await syncGooglePlaces();
```
Par :
```js
    await syncAll();
```

- [ ] **Step 4 : Vérifier que le backend démarre sans erreur**

```bash
cd backend && npm run dev
```

Sortie attendue : `Server listening on port 5000` sans aucune erreur de require ou de syntaxe.

- [ ] **Step 5 : Commit**

```bash
git add backend/src/app.js
git commit -m "feat(api): route import-google et cron utilisent syncAll() (DZ+FR)"
```

---

### Task 5 : bankConfig.js — identité visuelle banques françaises

**Files:**
- Modify: `frontend/src/utils/bankConfig.js`

- [ ] **Step 1 : Ajouter les entrées françaises dans BANK_CONFIGS**

Ajouter juste avant le `]` de fermeture du tableau `BANK_CONFIGS` :

```js
  // ── Banques françaises ──────────────────────────────────────────────────────
  {
    key: 'credit-agricole',
    match: /crédit\s*agricole|credit\s*agricole|caisse\s+(r[eé]gionale|locale)/i,
    abbr: 'CA',
    bg: '#008A00',
    text: '#fff',
    label: 'Crédit Agricole',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Logo_Cr%C3%A9dit_Agricole.svg',
  },
  {
    key: 'lcl',
    match: /\blcl\b|lyonnais/i,
    abbr: 'LCL',
    bg: '#D20019',
    text: '#fff',
    label: 'LCL',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/LCL_logo_2019.svg',
  },
  {
    key: 'banque-postale',
    // Exclut "Algérie Poste" / "Algerie Poste" déjà géré par la clé 'poste'
    match: /banque\s*postale|la\s*poste(?!\s*(alg[eé]r|dz))/i,
    abbr: 'LP',
    bg: '#F7A600',
    text: '#fff',
    label: 'La Banque Postale',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/La_Banque_Postale.svg',
  },
  {
    key: 'cic',
    match: /\bcic\b|cr[eé]dit\s*industriel/i,
    abbr: 'CIC',
    bg: '#003B8E',
    text: '#fff',
    label: 'CIC',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/CIC_logo_2021.svg',
  },
  {
    key: 'credit-mutuel',
    match: /cr[eé]dit\s*mutuel/i,
    abbr: 'CM',
    bg: '#003189',
    text: '#fff',
    label: 'Crédit Mutuel',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Cr%C3%A9dit_Mutuel_logo.svg',
  },
  {
    key: 'bred',
    match: /\bbred\b/i,
    abbr: 'BRED',
    bg: '#0055A5',
    text: '#fff',
    label: 'Bred',
    logoUrl: null,
  },
  {
    key: 'banque-populaire',
    match: /banque\s*populaire/i,
    abbr: 'BP',
    bg: '#0066CC',
    text: '#fff',
    label: 'Banque Populaire',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Banques-populaires-logo.svg',
  },
  {
    key: 'caisse-epargne',
    match: /caisse\s+d.?[eé]pargne/i,
    abbr: 'CE',
    bg: '#8B1A1A',
    text: '#fff',
    label: "Caisse d'Épargne",
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Caisse_d%27%C3%A9pargne_logo.svg',
  },
  {
    key: 'hsbc',
    match: /\bhsbc\b/i,
    abbr: 'HSBC',
    bg: '#DB0011',
    text: '#fff',
    label: 'HSBC',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg',
  },
```

- [ ] **Step 2 : Vérifier que le frontend compile sans erreur**

```bash
cd frontend && npm run dev
```

Sortie attendue : `Local: http://localhost:5173/` sans erreur.

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/utils/bankConfig.js
git commit -m "feat(frontend): logos et couleurs banques françaises dans bankConfig"
```

---

### Task 6 : Test de l'import en local

- [ ] **Step 1 : Vérifier la clé Google Places dans le .env**

```bash
grep GOOGLE_PLACES_API_KEY backend/.env
```

Résultat attendu : `GOOGLE_PLACES_API_KEY=AIza...` (non vide). Si vide, renseigner la clé avant de continuer.

- [ ] **Step 2 : Lancer l'import France uniquement**

```bash
cd backend
node -e "require('./src/utils/frImport').syncFrancePlaces().then(r => console.log(JSON.stringify(r, null, 2)))"
```

Exemple de sortie attendue :
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

Si `errors > 0`, vérifier la connexion PostgreSQL et la clé API.

- [ ] **Step 3 : Vérifier les DABs français en BDD**

```bash
psql $DATABASE_URL -c "
  SELECT b.nom, COUNT(d.id) AS nb_dabs
  FROM dabs d
  JOIN banques b ON d.banque_id = b.id
  WHERE d.latitude BETWEEN 41 AND 52
    AND d.longitude BETWEEN -5 AND 10
  GROUP BY b.nom
  ORDER BY nb_dabs DESC
  LIMIT 15;
"
```

Les banques françaises (Crédit Agricole, BNP Paribas, Société Générale…) doivent apparaître avec des comptages cohérents (> 50 DABs chacune pour les grandes enseignes).

- [ ] **Step 4 : Vérifier visuellement sur la carte**

Démarrer le frontend (`npm run dev` dans `frontend/`) et ouvrir http://localhost:5173. Centrer la carte sur Paris ou Lyon. Les DABs français doivent s'afficher avec les bons logos et couleurs sur les marqueurs.

- [ ] **Step 5 : Commit**

```bash
git add .
git commit -m "chore: test import banques françaises validé en local"
```

---

### Task 7 : Push sur GitHub

- [ ] **Step 1 : Vérifier l'état git**

```bash
git log --oneline -8
```

Les 7 commits des tasks précédentes doivent être présents.

- [ ] **Step 2 : Push sur develop**

```bash
git push origin develop
```
