const axios   = require('axios');
const db      = require('../config/db');
const { env } = require('../config/env');

const GOOGLE_PLACES_URL       = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const RADIUS_METERS           = 25000;
const DELAY_BETWEEN_CITIES_MS = 300;

const FRENCH_CITIES = [
  // Île-de-France
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
    await sleep(2000);
    data = await fetchPage({ pagetoken: data.next_page_token });
    results.push(...(data.results || []));
  }
  return results;
};

/**
 * Retourne l'id d'une banque par son nom exact dans la table banques.
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

  // Supprimer noms génériques sans banque
  const delGeneric = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ~* '^(atm|dab|distributeur|distributeur automatique|guichet automatique|banque|bank)$'
      OR nom ~* '^(atm [0-9]+|dab [0-9]+)$'
    )
  `);
  deleted += delGeneric.rowCount;

  // Supprimer entités non-ATMs françaises
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

  // Banque de France (banque centrale — pas de DABs publics)
  const delBDF = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ILIKE '%banque de france%' OR nom ILIKE '%banque centrale%'
    )
  `);
  deleted += delBDF.rowCount;

  // Récupérer les IDs des banques françaises dynamiquement
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

  await linkBank(bnpId,   `nom ILIKE '%bnp%' OR nom ILIKE '%paribas%' OR nom ILIKE '%hello bank%'`);
  await linkBank(sgId,    `nom ILIKE '%société générale%' OR nom ILIKE '%societe generale%' OR nom = 'SG' OR nom ILIKE '%crédit du nord%' OR nom ILIKE '%credit du nord%'`);
  await linkBank(caId,    `nom ILIKE '%crédit agricole%' OR nom ILIKE '%credit agricole%' OR nom ILIKE '%caisse régionale%' OR nom ILIKE '%caisse regionale%' OR nom ILIKE '%caisse locale%'`);
  await linkBank(lclId,   `nom ILIKE '%lcl%' OR nom ILIKE '%lyonnais%'`);
  await linkBank(posteId, `nom ILIKE '%banque postale%' OR (nom ILIKE '%la poste%' AND nom NOT ILIKE '%algérie%' AND nom NOT ILIKE '%algerie%') OR nom = 'Poste' OR nom = 'LA POSTE'`);
  await linkBank(cicId,   `nom ILIKE '%cic%' OR nom ILIKE '%crédit industriel%' OR nom ILIKE '%credit industriel%'`);
  await linkBank(cmId,    `nom ILIKE '%crédit mutuel%' OR nom ILIKE '%credit mutuel%'`);
  await linkBank(bredId,  `nom ILIKE '%bred%'`);
  await linkBank(bpId,    `nom ILIKE '%banque populaire%'`);
  await linkBank(ceId,    `nom ILIKE '%caisse d''épargne%' OR nom ILIKE '%caisse d''epargne%'`);
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
