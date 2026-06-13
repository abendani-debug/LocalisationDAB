const axios = require('axios');
const db    = require('../config/db');

// Serveurs Overpass (on essaie dans l'ordre en cas de timeout)
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

// France découpée en 5 régions — bboxes calibrées pour ne pas déborder sur Suisse/Italie/Espagne
// France métropole : lat 42.3-51.1, lng -5.1-8.3 | Corse : lat 41.3-43.1, lng 8.4-9.8
const FRANCE_REGIONS = [
  { name: 'Nord-Ouest', bbox: '46.5,-5.1,51.1,2.4' },   // Bretagne, Normandie, HdF, PdL
  { name: 'Nord-Est',   bbox: '46.5,2.4,51.1,8.3' },    // ÎdF Est, Grand Est, Bourgogne
  { name: 'Sud-Ouest',  bbox: '42.3,-5.1,46.5,1.8' },   // NAQ, Occitanie Ouest, Pyrénées
  { name: 'Sud-Est',    bbox: '42.3,1.8,46.5,8.3' },    // PACA, AuRA, Occitanie Est
  { name: 'Corse',      bbox: '41.3,8.4,43.1,9.8' },    // Corse uniquement
];

// ── Correspondance tags OSM → nom en base ──────────────────────────────────
const BANK_PATTERNS = [
  { key: 'bnp',              re: /bnp|paribas|hello\s*bank/i,                   nom: 'BNP Paribas' },
  { key: 'sg',               re: /soci[eé]t[eé]\s*g[eé]n[eé]rale|^sg$/i,        nom: 'Société Générale' },
  { key: 'credit-agricole',  re: /cr[eé]dit\s*agricole|caisse\s+(r[eé]gionale|locale)/i, nom: 'Crédit Agricole' },
  { key: 'lcl',              re: /\blcl\b|lyonnais/i,                            nom: 'LCL' },
  { key: 'banque-postale',   re: /banque\s*postale|la\s*poste/i,                 nom: 'La Banque Postale' },
  { key: 'cic',              re: /\bcic\b|cr[eé]dit\s*industriel/i,              nom: 'CIC' },
  { key: 'credit-mutuel',    re: /cr[eé]dit\s*mutuel/i,                          nom: 'Crédit Mutuel' },
  { key: 'bred',             re: /\bbred\b/i,                                    nom: 'Bred Banque Populaire' },
  { key: 'banque-populaire', re: /banque\s*populaire/i,                          nom: 'Banque Populaire' },
  { key: 'caisse-epargne',   re: /caisse\s+d.?[eé]pargne/i,                     nom: "Caisse d'Épargne" },
  { key: 'hsbc',             re: /\bhsbc\b/i,                                    nom: 'HSBC France' },
];

/**
 * Résout le nom d'une banque depuis les tags OSM (operator, brand, name).
 * Retourne { bankNom, bankId } ou null si non reconnu.
 */
const resolveBank = async (tags = {}) => {
  const candidate = tags.operator || tags.brand || tags.name || '';
  const match = BANK_PATTERNS.find(p => p.re.test(candidate));
  if (!match) return null;
  const r = await db.query('SELECT id FROM banques WHERE nom = $1 LIMIT 1', [match.nom]);
  return r.rows[0] ? { bankNom: match.nom, bankId: r.rows[0].id } : null;
};

/**
 * Extrait le meilleur nom d'un nœud OSM.
 */
const extractName = (tags = {}) =>
  tags.name || tags.operator || tags.brand || 'DAB';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Requête Overpass avec retry sur plusieurs serveurs + backoff exponentiel.
 */
const overpassQuery = async (query) => {
  for (let attempt = 0; attempt < OVERPASS_SERVERS.length; attempt++) {
    const server = OVERPASS_SERVERS[attempt];
    const waitMs = attempt === 0 ? 0 : 15000 * attempt; // 0s, 15s, 30s
    if (waitMs > 0) {
      console.log(`[import-fr] Attente ${waitMs / 1000}s avant ${server}…`);
      await sleep(waitMs);
    }
    try {
      const response = await axios({
        method: 'POST',
        url: server,
        data: new URLSearchParams({ data: query }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'LocalisationDAB/1.0 contact@mapsdab.com',
        },
        timeout: 150000,
      });
      return response.data.elements || [];
    } catch (err) {
      const status = err.response?.status;
      console.warn(`[import-fr] ${server} → ${status || err.message}`);
    }
  }
  throw new Error('Tous les serveurs Overpass ont échoué');
};

/**
 * Récupère tous les DABs de France via Overpass API (5 régions).
 * @returns {Array} tableau de nœuds OSM dédupliqués
 */
const fetchATMsFrance = async () => {
  const seen  = new Set();
  const nodes = [];

  for (const region of FRANCE_REGIONS) {
    const query = `[out:json][timeout:90];node["amenity"="atm"](${region.bbox});out body;`;
    console.log(`[import-fr] Région ${region.name}…`);
    const elements = await overpassQuery(query);
    let newCount = 0;
    for (const el of elements) {
      if (!seen.has(el.id)) { seen.add(el.id); nodes.push(el); newCount++; }
    }
    console.log(`[import-fr] ${region.name} → ${elements.length} nœuds (${newCount} nouveaux)`);
    await sleep(20000); // délai poli de 20s entre régions
  }

  console.log(`[import-fr] Total : ${nodes.length} nœuds OSM uniques`);
  return nodes;
};

/**
 * Supprime les entrées Google Places françaises remplacées par OSM.
 */
const deleteGooglePlacesFR = async () => {
  const r = await db.query(
    `DELETE FROM dabs WHERE country_code = 'FR' AND source = 'google_places'`
  );
  console.log(`[import-fr] ${r.rowCount} entrées Google Places FR supprimées`);
  return r.rowCount;
};

/**
 * Importe tous les DABs de France via Overpass / OpenStreetMap.
 * @returns {{ total, inserted, updated, skipped, errors, deleted }}
 */
const syncFrancePlaces = async () => {
  // 1. Supprimer les anciennes données Google Places FR
  const deleted = await deleteGooglePlacesFR();

  // 2. Récupérer les données OSM
  const nodes = await fetchATMsFrance();

  let inserted = 0, updated = 0, skipped = 0, errors = 0;

  // 3. Insérer / mettre à jour chaque nœud
  for (const node of nodes) {
    if (!node.lat || !node.lon) { skipped++; continue; }

    try {
      const tags    = node.tags || {};
      const osmId   = `osm_${node.id}`;
      const nom     = extractName(tags);
      const adresse = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
        .filter(Boolean).join(' ') || null;

      const bank = await resolveBank(tags);

      const result = await db.query(
        `INSERT INTO dabs (osm_id, nom, adresse, latitude, longitude, statut, type_lieu, source, is_verified, country_code, banque_id)
         VALUES ($1, $2, $3, $4, $5, 'actif', 'atm', 'osm', TRUE, 'FR', $6)
         ON CONFLICT (osm_id) DO UPDATE SET
           nom          = EXCLUDED.nom,
           adresse      = EXCLUDED.adresse,
           latitude     = EXCLUDED.latitude,
           longitude    = EXCLUDED.longitude,
           banque_id    = EXCLUDED.banque_id,
           country_code = EXCLUDED.country_code,
           updated_at   = NOW()
         RETURNING (xmax = 0) AS is_insert`,
        [osmId, nom, adresse, node.lat, node.lon, bank?.bankId ?? null]
      );

      if (result.rows[0]?.is_insert) inserted++;
      else updated++;
    } catch (err) {
      if (errors === 0) console.error('[import-fr] Première erreur SQL :', err.message);
      errors++;
    }
  }

  console.log(`[import-fr] terminé — inserted:${inserted} updated:${updated} skipped:${skipped} errors:${errors}`);
  return { total: nodes.length, inserted, updated, skipped, errors, deleted };
};

module.exports = { syncFrancePlaces };
