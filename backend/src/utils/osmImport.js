const axios = require('axios');
const db = require('../config/db');
const { env } = require('../config/env');

const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const RADIUS_METERS     = 25000; // 25 km autour de chaque ville
const DELAY_BETWEEN_CITIES_MS = 300;

// Capitales des 48 wilayas algériennes + grandes agglomérations
const ALGERIAN_CITIES = [
  // --- Nord / Tell ---
  { name: 'Alger',              lat: 36.7372, lng:  3.0865 },
  { name: 'Oran',               lat: 35.6969, lng: -0.6331 },
  { name: 'Constantine',        lat: 36.3650, lng:  6.6147 },
  { name: 'Annaba',             lat: 36.9000, lng:  7.7667 },
  { name: 'Blida',              lat: 36.4703, lng:  2.8277 },
  { name: 'Batna',              lat: 35.5553, lng:  6.1742 },
  { name: 'Sétif',              lat: 36.1898, lng:  5.4108 },
  { name: 'Tlemcen',            lat: 34.8828, lng: -1.3159 },
  { name: 'Béjaïa',             lat: 36.7539, lng:  5.0564 },
  { name: 'Tizi Ouzou',         lat: 36.7169, lng:  4.0497 },
  { name: 'Sidi Bel Abbès',     lat: 35.1896, lng: -0.6306 },
  { name: 'Médéa',              lat: 36.2638, lng:  2.7539 },
  { name: 'Chlef',              lat: 36.1647, lng:  1.3315 },
  { name: 'Mostaganem',         lat: 35.9318, lng:  0.0892 },
  { name: 'Skikda',             lat: 36.8762, lng:  6.9063 },
  { name: 'Tiaret',             lat: 35.3706, lng:  1.3217 },
  { name: 'Guelma',             lat: 36.4617, lng:  7.4328 },
  { name: 'Souk Ahras',         lat: 36.2864, lng:  7.9509 },
  { name: 'Jijel',              lat: 36.8222, lng:  5.7667 },
  { name: 'Mascara',            lat: 35.3967, lng:  0.1400 },
  { name: "M'Sila",             lat: 35.7044, lng:  4.5397 },
  { name: 'Relizane',           lat: 35.7361, lng:  0.5558 },
  { name: 'Saïda',              lat: 34.8306, lng:  0.1525 },
  { name: 'El Tarf',            lat: 36.7667, lng:  8.3128 },
  { name: 'Tipaza',             lat: 36.5898, lng:  2.4469 },
  { name: 'Aïn Defla',          lat: 36.2600, lng:  1.9667 },
  { name: 'Aïn Témouchent',     lat: 35.2981, lng: -1.1386 },
  { name: 'Bordj Bou Arreridj', lat: 36.0731, lng:  4.7631 },
  { name: 'Boumerdès',          lat: 36.7625, lng:  3.4775 },
  { name: 'Bouira',             lat: 36.3706, lng:  3.9006 },
  { name: 'Khenchela',          lat: 35.4258, lng:  7.1456 },
  { name: 'Mila',               lat: 36.4500, lng:  6.2653 },
  { name: 'Oum El Bouaghi',     lat: 35.8756, lng:  7.1128 },
  { name: 'Tébessa',            lat: 35.4044, lng:  8.1197 },
  { name: 'Souk El Haad',       lat: 35.9000, lng:  2.9500 },
  // --- Hauts Plateaux / Semi-aride ---
  { name: 'Biskra',             lat: 34.8482, lng:  5.7281 },
  { name: 'Naâma',              lat: 33.2681, lng: -0.3122 },
  { name: 'Laghouat',           lat: 33.8000, lng:  2.8653 },
  { name: 'Djelfa',             lat: 34.6700, lng:  3.2600 },
  { name: 'El Bayadh',          lat: 33.6833, lng:  1.0167 },
  // --- Grand Sud ---
  { name: 'Ghardaïa',           lat: 32.4894, lng:  3.6731 },
  { name: 'Ouargla',            lat: 31.9539, lng:  5.3242 },
  { name: 'El Oued',            lat: 33.3681, lng:  6.8674 },
  { name: 'Béchar',             lat: 31.6238, lng: -2.2168 },
  { name: 'Adrar',              lat: 27.8742, lng: -0.2892 },
  { name: 'In Salah',           lat: 27.1979, lng:  2.4697 },
  { name: 'Tindouf',            lat: 27.6744, lng: -8.1375 },
  { name: 'Tamanrasset',        lat: 22.7851, lng:  5.5228 },
  { name: 'Illizi',             lat: 26.4833, lng:  8.4833 },
  // --- Nouvelles wilayas (découpage 2021 — total 58) ---
  { name: 'Timimoun',           lat: 29.2636, lng:  0.2325 },
  { name: 'Bordj Badji Mokhtar',lat: 21.3294, lng:  0.9492 },
  { name: 'Ouled Djellal',      lat: 34.4194, lng:  5.0697 },
  { name: 'Beni Abbès',         lat: 30.1292, lng: -2.1694 },
  { name: 'In Guezzam',         lat: 19.5667, lng:  5.7694 },
  { name: 'Touggourt',          lat: 33.1003, lng:  6.0681 },
  { name: 'Djanet',             lat: 24.5553, lng:  9.4844 },
  { name: "El M'Ghair",         lat: 33.9442, lng:  5.9228 },
  { name: 'El Meniaa',          lat: 30.5806, lng:  2.8794 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Types qui indiquent clairement que le lieu n'est PAS un DAB → rejet total
const REJECT_TYPES = new Set([
  'restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery',
  'bakery', 'night_club', 'lodging', 'beauty_salon', 'hair_care',
  'school', 'university', 'hospital', 'doctor', 'dentist',
  'movie_theater', 'amusement_park', 'stadium', 'gym', 'spa',
  'mosque', 'church', 'place_of_worship',
]);

// Types qui indiquent un ATM intégré dans un autre établissement → review admin
const AMBIGUOUS_TYPES = new Set([
  'supermarket', 'grocery_or_supermarket', 'store', 'clothing_store',
  'convenience_store', 'department_store', 'shopping_mall',
  'gas_station', 'pharmacy', 'drugstore', 'post_office',
  'airport', 'train_station', 'bus_station', 'transit_station',
]);

/**
 * Classifie un lieu retourné par Google Places pour type=atm.
 * @returns {'accept' | 'review' | 'reject'}
 */
const classifyATM = (types = []) => {
  if (!types.includes('atm')) return 'reject';
  if (types.some(t => REJECT_TYPES.has(t))) return 'reject';
  if (types.some(t => AMBIGUOUS_TYPES.has(t))) return 'review';
  return 'accept';
};

/**
 * Récupère une page de résultats Google Places.
 */
const fetchPage = async (params) => {
  const response = await axios.get(GOOGLE_PLACES_URL, {
    params: { ...params, key: env.GOOGLE_PLACES_API_KEY },
    timeout: 15000,
  });
  return response.data;
};

/**
 * Récupère tous les résultats (pagination automatique via next_page_token).
 */
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
 * Importe ou met à jour les DAB et agences bancaires pour les 48 wilayas algériennes.
 * @returns {{ total, inserted, updated, errors, cities }}
 */
const syncGooglePlaces = async () => {
  const seen   = new Set();
  const places = [];
  let cityErrors = 0;

  for (const city of ALGERIAN_CITIES) {
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

      console.log(`[import] ${city.name} — atm:${atms.length} bank:${banks.length}`);
    } catch (err) {
      console.error(`[import] Erreur pour ${city.name}:`, err.message);
      cityErrors++;
    }
  }

  console.log(`[import] ${places.length} lieux uniques — insertion en cours…`);

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const place of places) {
    try {
      const typeLieu = place._type === 'bank' ? 'agence' : 'atm';

      // Filtrage qualité : uniquement pour les ATM
      let isVerified = true;
      if (place._type === 'atm') {
        const classification = classifyATM(place.types || []);
        if (classification === 'reject') {
          skipped++;
          continue;
        }
        if (classification === 'review') {
          isVerified = false; // nécessite validation admin
        }
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
      if (errors === 0) console.error('[import] Première erreur SQL :', err.message);
      errors++;
    }
  }

  console.log(`[import] Import terminé — inserted:${inserted} updated:${updated} skipped:${skipped} errors:${errors}`);
  console.log('[import] Nettoyage automatique en cours…');

  const { deleted, linked } = await cleanupAfterImport();
  console.log(`[import] Nettoyage terminé — supprimés:${deleted} liés:${linked}`);

  return {
    total: places.length,
    inserted,
    updated,
    skipped,
    errors,
    cities: ALGERIAN_CITIES.length - cityErrors,
    cleanup: { deleted, linked },
  };
};

/**
 * Supprime les faux ATMs et lie les DABs à leur banque après un import Google Places.
 * Reprend toutes les règles du fichier docs/nettoyage_bdd.md.
 * @returns {{ deleted, linked }}
 */
const cleanupAfterImport = async () => {
  let deleted = 0;
  let linked  = 0;

  // ── ÉTAPE 1 : Supprimer les noms génériques sans banque ─────────────────────
  // Un marqueur "ATM" sans banque associée n'apporte aucune info à l'utilisateur
  const delGeneric = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ~* '^(atm|dab|gab|cab|distributeur|distributeur automatique|distributeur automatique de billets|guichet automatique|guichet automatique de billets|banque|bank|agence bancaire|agence bank)$'
      OR nom ~* '^(صراف|صراف آلي|ماكينة صراف|ماكينة|صرافة|بنك|بنك آلي)$'
      OR nom ~* '^(atm [0-9]+|dab [0-9]+|gab [0-9]+)$'
    )
  `);
  deleted += delGeneric.rowCount;

  // ── ÉTAPE 2 : Supprimer les faux ATMs ───────────────────────────────────────

  // Assurances, télécoms, voyages, administrations
  const del1 = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ILIKE '%djezzy%' OR nom ILIKE '%mobilis%' OR nom ILIKE '%ooredoo%'
      OR nom ILIKE '%assurance%' OR nom ILIKE '%CAAT%' OR nom ILIKE '%CIAR%'
      OR nom ILIKE '%télécom%' OR nom ILIKE '%telecom%'
      OR nom ILIKE '%voyage%' OR nom ILIKE '%tourisme%'
      OR nom ILIKE '%impôt%' OR nom ILIKE '%impot%'
      OR nom ILIKE '%CNAS%' OR nom ILIKE '%CASNOS%' OR nom ILIKE '%CNAC%'
      OR nom ILIKE '%trésor%' OR nom ILIKE '%tresor%'
      OR nom ILIKE '%leasing%' OR nom ILIKE '%sofinance%'
      OR nom ILIKE '%café%' OR nom ILIKE '%cnl agence%'
      OR nom ILIKE '%ترامواي%' OR nom ILIKE '%tramway%'
      OR nom ILIKE '%quinquaillerie%' OR nom ILIKE '%residence vacance%'
      OR nom ILIKE '%torchi tours%' OR nom ILIKE '%youmid tour%'
      OR nom ILIKE '%money exchange%' OR nom ILIKE '%moneygram%'
      OR nom ILIKE '%mutualite%' OR nom ILIKE '%fgar%'
      OR nom ILIKE '%fonds de garantie%' OR nom ILIKE '%gateaux%'
      OR nom ILIKE '%imprimerie%' OR nom ILIKE '%kiosque%'
      OR nom ILIKE '%sae exact%' OR nom ILIKE '%fsie%'
      OR nom ILIKE '%dar el affroun%' OR nom ILIKE '%mla blida%'
      OR nom ILIKE '%اتصالات الجزائر%' OR nom ILIKE '%اصلاح الهواتف%'
      OR nom ILIKE '%قطع غيار%' OR nom ILIKE '%خزينة%'
      OR nom ILIKE '%الصندوق الوطني للتقاعد%' OR nom ILIKE '%سونلغاز%'
      OR nom ILIKE '%محجرة%' OR nom ILIKE '%تغليف السيارات%'
      OR nom ILIKE '%مستودع%' OR nom ILIKE '%مكتبة%'
      OR nom ILIKE '%جرافيولا%' OR nom ILIKE '%دار الصحافة%'
      OR nom ILIKE '%تطبيقات%' OR nom ILIKE '%gare routière%'
      OR nom ILIKE '%التعاون الفلاحي%' OR nom ILIKE '%الصندوق الجهوي للتعاون%'
      OR nom ILIKE '%المحيط الفلاحي%' OR nom ILIKE '%المنطقة الصناعية%'
      OR nom ILIKE '%صندوق الضمان الفلاحي%' OR nom ILIKE '%مركز دعم تشغيل%'
      OR nom ILIKE '%المصرف الجهوي للمطاط%' OR nom ILIKE '%محطة الفيراج%'
      OR nom ILIKE '%كشك متعدّد%' OR nom ILIKE '%حاسي السوق%'
      OR nom ILIKE '%البيرو بحيا%' OR nom ILIKE '%fni /%'
    )
  `);
  deleted += del1.rowCount;

  // Banque d'Algérie (banque centrale — pas de DABs publics)
  const del2 = await db.query(`
    DELETE FROM dabs WHERE banque_id IS NULL AND (
      nom ILIKE '%bank of algeria%' OR nom ILIKE '%banque d''algerie%'
      OR nom ILIKE '%banque d''algérie%' OR nom ILIKE '%banque centrale%'
      OR nom ILIKE '%crma%' OR nom ILIKE '%banco sabadell%'
      OR nom ILIKE '%بنك الجزائر%' OR nom ILIKE '%البنك المركزي%'
    )
  `);
  deleted += del2.rowCount;

  // ── ÉTAPE 2 : Lier Algérie Poste (banque_id = 8) ────────────────────────────
  const upPoste = await db.query(`
    UPDATE dabs SET banque_id = 8 WHERE banque_id IS NULL AND (
      nom ILIKE '%algerie poste%' OR nom ILIKE '%algérie poste%'
      OR nom ILIKE '%alger poste%' OR nom ILIKE '%la poste%'
      OR nom ILIKE '%gab poste%' OR nom ILIKE '%dab poste%'
      OR nom ILIKE '%dab - poste%' OR nom ILIKE '%dab ap %'
      OR nom ILIKE '%distributeur%poste%' OR nom ILIKE '%distributaire%poste%'
      OR nom ILIKE '%bureau de poste%' OR nom ILIKE '%centre de poste%'
      OR nom ILIKE '%poste atm%' OR nom ILIKE '%ptt%'
      OR nom ILIKE '%ccp%' OR nom ILIKE '%eddahabia%' OR nom ILIKE '%dahabia%'
      OR nom ILIKE '%post office%' OR nom ILIKE '%postal %'
      OR nom ILIKE 'Poste %' OR nom ILIKE '%agence clic%'
      OR nom ILIKE '%بريد الجزائر%' OR nom ILIKE '%مركز البريد%'
      OR nom ILIKE '%مكتب بريد%' OR nom ILIKE '%صراف آلي بريد%'
      OR nom ILIKE '%قابض البريد%' OR nom ILIKE '%مركز بريد%'
      OR nom ILIKE '%صرافة تابعة للمركز بريد%'
      OR nom ILIKE '%ماكنتة صراف ألي بريد%' OR nom ILIKE '%صراف الي ، بريد%'
      OR nom ILIKE '%صندوق التوفير الإحتياط%'
      OR nom ILIKE '%البريد الرئيسي%' OR nom ILIKE '%البريد المركزي%'
      OR nom ILIKE '%صراف الألي بريد%'
      OR nom IN ('Poste', 'LA POSTE', 'la poste')
    )
  `);
  linked += upPoste.rowCount;

  // ── ÉTAPE 3 : Lier toutes les banques ───────────────────────────────────────

  // CPA (ID 1) — AVANT BNA pour éviter que "Algerian Popular" soit mappé sur BNA
  const upCPA = await db.query(`
    UPDATE dabs SET banque_id = 1 WHERE banque_id IS NULL AND (
      nom ILIKE '%cpa%' OR nom ILIKE '%crédit populaire%' OR nom ILIKE '%credit populaire%'
      OR nom ILIKE '%c p a%' OR nom ILIKE '%c.p.a%'
      OR nom ILIKE '%popular credit of algeria%' OR nom ILIKE '%algerian communal credit%'
      OR nom ILIKE '%algerian popular%' OR nom ILIKE '%popular loan%'
      OR nom ILIKE '%القرض الشعبي الجزائري%' OR nom ILIKE '%بنك القرض الشعبي%'
    )
  `);
  linked += upCPA.rowCount;
  // Correction : si "Algerian Popular" a été lié à BNA par un import précédent
  await db.query(`UPDATE dabs SET banque_id = 1 WHERE banque_id = 2 AND nom ILIKE '%algerian popular%'`);

  // BNA (ID 2)
  const upBNA = await db.query(`
    UPDATE dabs SET banque_id = 2 WHERE banque_id IS NULL AND (
      nom ILIKE '%bna%' OR nom ILIKE '%banque nationale%' OR nom ILIKE '%banque national%'
      OR nom ILIKE '%b.n.a%' OR nom ILIKE '%البنك الوطني الجزائري%'
      OR nom ILIKE '%المصرف الوطني الجزائري%'
    )
  `);
  linked += upBNA.rowCount;

  // BEA (ID 3)
  const upBEA = await db.query(`
    UPDATE dabs SET banque_id = 3 WHERE banque_id IS NULL AND (
      nom ILIKE '%bea%' OR nom ILIKE '%banque extérieure%' OR nom ILIKE '%banque exterieure%'
      OR nom ILIKE '%b.e.a%' OR nom ILIKE '%banque exterieur%' OR nom ILIKE '%banque extérieur%'
      OR nom ILIKE '%banque exrérieure%'
      OR nom ILIKE '%بنك الجزائر الخارجي%' OR nom ILIKE '%البنك الخارجي%'
    )
  `);
  linked += upBEA.rowCount;

  // CNEP (ID 4)
  const upCNEP = await db.query(`
    UPDATE dabs SET banque_id = 4 WHERE banque_id IS NULL AND (
      nom ILIKE '%cnep%' OR nom ILIKE '%c.n.e.p%'
      OR nom ILIKE '%الصندوق الوطني للتوفير%'
    )
  `);
  linked += upCNEP.rowCount;

  // BADR (ID 5)
  const upBADR = await db.query(`
    UPDATE dabs SET banque_id = 5 WHERE banque_id IS NULL AND (
      nom ILIKE '%badr%' OR nom ILIKE '%agricult%' OR nom ILIKE '%b.a.d.r%'
      OR nom ILIKE '%bdr banque%' OR nom ILIKE '%rural development bank%'
      OR nom ILIKE '%بنك الفلاحة%' OR nom ILIKE '%بنك التنمية الريفية%'
      OR nom ILIKE '%البنك الفلاحي%' OR nom ILIKE '%بنك الفلاحه%'
      OR nom ILIKE '%البنك المركزي الفلاحي%' OR nom ILIKE '%التنمية الفلاحية%'
    )
  `);
  linked += upBADR.rowCount;

  // BDL (ID 6) — NE PAS inclure BADR ici
  const upBDL = await db.query(`
    UPDATE dabs SET banque_id = 6 WHERE banque_id IS NULL AND (
      nom ILIKE '%bdl%' OR nom ILIKE '%b.d.l%'
      OR nom ILIKE '%développement local%' OR nom ILIKE '%developpement local%'
      OR nom ILIKE '%banque de development%' OR nom ILIKE '%local development bank%'
      OR nom ILIKE '%بنك التنمية المحلية%' OR nom ILIKE '%مصرف التنمية المحلية%'
    )
  `);
  linked += upBDL.rowCount;

  // AGB (ID 7)
  const upAGB = await db.query(`
    UPDATE dabs SET banque_id = 7 WHERE banque_id IS NULL AND (
      nom ILIKE '%agb%' OR nom ILIKE '%gulf bank%' OR nom ILIKE '%a.g.b%'
      OR nom ILIKE '%banka general%'
      OR nom ILIKE '%بنك الخليج الجزائر%' OR nom ILIKE '%بنك الخليج%'
    )
  `);
  linked += upAGB.rowCount;

  // SGA (ID 9)
  const upSGA = await db.query(`
    UPDATE dabs SET banque_id = 9 WHERE banque_id IS NULL AND (
      nom ILIKE '%société générale%' OR nom ILIKE '%societe generale%' OR nom ILIKE '%sga%'
      OR nom = 'SG' OR nom ILIKE '%societe general%' OR nom ILIKE '%société general%'
      OR nom ILIKE '%societé generale%'
      OR nom ILIKE '%سوسيتي جنرال%' OR nom ILIKE '%سوسيتيه جنرال%'
      OR nom ILIKE '%سوسيتي جينيرال%'
    )
  `);
  linked += upSGA.rowCount;

  // BNP Paribas (ID 10)
  const upBNP = await db.query(`
    UPDATE dabs SET banque_id = 10 WHERE banque_id IS NULL AND (
      nom ILIKE '%bnp%' OR nom ILIKE '%paribas%' OR nom ILIKE '%البنك الفرنسي%'
    )
  `);
  linked += upBNP.rowCount;

  // Banque Salam (ID 11)
  const upSalam = await db.query(`
    UPDATE dabs SET banque_id = 11 WHERE banque_id IS NULL AND (
      nom ILIKE '%salam%' OR nom ILIKE '%بنك السلام%' OR nom ILIKE '%مصرف السلام%'
    )
  `);
  linked += upSalam.rowCount;

  // Al Baraka (ID 13)
  const upBaraka = await db.query(`
    UPDATE dabs SET banque_id = 13 WHERE banque_id IS NULL AND (
      nom ILIKE '%baraka%' OR nom ILIKE '%al baraka%' OR nom ILIKE '%بنك البركة%'
    )
  `);
  linked += upBaraka.rowCount;

  // ABC Banque (ID 15)
  const upABC = await db.query(`UPDATE dabs SET banque_id = 15 WHERE banque_id IS NULL AND nom ILIKE '%abc%'`);
  linked += upABC.rowCount;

  // Fransabank (ID 16)
  const upFransa = await db.query(`UPDATE dabs SET banque_id = 16 WHERE banque_id IS NULL AND nom ILIKE '%fransa%'`);
  linked += upFransa.rowCount;

  // Housing Bank (ID 17)
  const upHousing = await db.query(`UPDATE dabs SET banque_id = 17 WHERE banque_id IS NULL AND nom ILIKE '%housing%'`);
  linked += upHousing.rowCount;

  // Trust Bank Algeria (ID 18)
  const upTrust = await db.query(`
    UPDATE dabs SET banque_id = 18 WHERE banque_id IS NULL AND (
      nom ILIKE '%trust bank%' OR nom ILIKE '%trust-banque%' OR nom ILIKE '%trust banque%'
      OR nom ILIKE '%ترست بنك%' OR nom ILIKE '%بنك ترست%'
    )
  `);
  linked += upTrust.rowCount;

  // Arab Bank Algeria (ID 19)
  const upArab = await db.query(`UPDATE dabs SET banque_id = 19 WHERE banque_id IS NULL AND nom ILIKE '%arab bank%'`);
  linked += upArab.rowCount;

  // Natixis Algérie (ID 20)
  const upNatixis = await db.query(`UPDATE dabs SET banque_id = 20 WHERE banque_id IS NULL AND nom ILIKE '%natixis%'`);
  linked += upNatixis.rowCount;

  return { deleted, linked };
};

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
