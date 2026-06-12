const db = require('../config/db');
const { boundingBox } = require('../utils/geoUtils');

const VOTE_DOMINANT_SQL = `(
  SELECT etat FROM signalements
  WHERE dab_id = d.id AND expires_at > NOW()
  GROUP BY etat ORDER BY COUNT(*) DESC LIMIT 1
) AS vote_dominant`;

const findAll = ({ lat, lng, radius, banque_id, statut, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = ['d.is_verified = TRUE'];

  if (lat && lng && radius) {
    const bb = boundingBox(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    params.push(bb.minLat, bb.maxLat, bb.minLon, bb.maxLon);
    conditions.push(
      `d.latitude  BETWEEN $${params.length - 3} AND $${params.length - 2}`,
      `d.longitude BETWEEN $${params.length - 1} AND $${params.length}`
    );
  }
  if (banque_id) { params.push(banque_id); conditions.push(`d.banque_id = $${params.length}`); }
  if (statut)    { params.push(statut);    conditions.push(`d.statut = $${params.length}`); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  params.push(limit, offset);

  return db.query(
    `SELECT d.*, b.nom AS banque_nom, ${VOTE_DOMINANT_SQL}
     FROM dabs d
     LEFT JOIN banques b ON d.banque_id = b.id
     ${where}
     ORDER BY d.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
};

const findNearby = (lat, lng, radiusKm = 2, banque_id = null) => {
  const bb = boundingBox(lat, lng, radiusKm);
  const params = [lat, lng, bb.minLat, bb.maxLat, bb.minLon, bb.maxLon, radiusKm];
  const banqueCondition = banque_id ? `AND sub.banque_id = $${params.push(banque_id)}` : '';
  return db.query(
    `SELECT * FROM (
       SELECT d.*, b.nom AS banque_nom,
         ${VOTE_DOMINANT_SQL},
         (6371 * acos(
           cos(radians($1)) * cos(radians(d.latitude::float)) *
           cos(radians(d.longitude::float) - radians($2)) +
           sin(radians($1)) * sin(radians(d.latitude::float))
         )) AS distance_km
       FROM dabs d
       LEFT JOIN banques b ON d.banque_id = b.id
       WHERE d.is_verified = TRUE
         AND d.latitude  BETWEEN $3 AND $4
         AND d.longitude BETWEEN $5 AND $6
     ) sub
     WHERE sub.distance_km <= $7
     ${banqueCondition}
     ORDER BY sub.distance_km ASC`,
    params
  );
};

const findById = (id) =>
  db.query(
    `SELECT d.*, b.nom AS banque_nom, ${VOTE_DOMINANT_SQL}
     FROM dabs d
     LEFT JOIN banques b ON d.banque_id = b.id
     WHERE d.id = $1`,
    [id]
  );

const create = ({ nom, adresse, latitude, longitude, statut = 'actif', banque_id, type_lieu = 'atm', source = 'admin' }) =>
  db.query(
    `INSERT INTO dabs (nom, adresse, latitude, longitude, statut, banque_id, type_lieu, source, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
     RETURNING *`,
    [nom, adresse || null, latitude, longitude, statut, banque_id || null, type_lieu, source]
  );

const propose = ({ nom, adresse, latitude, longitude, banque_id, type_lieu = 'atm', country_code = 'DZ' }) =>
  db.query(
    `INSERT INTO dabs (nom, adresse, latitude, longitude, statut, banque_id, type_lieu, source, is_verified, country_code)
     VALUES ($1, $2, $3, $4, 'actif', $5, $6, 'communaute', FALSE, $7)
     RETURNING *`,
    [nom, adresse || null, latitude, longitude, banque_id || null, type_lieu, country_code]
  );

const findPropositions = () =>
  db.query(
    `SELECT d.*, b.nom AS banque_nom
     FROM dabs d
     LEFT JOIN banques b ON d.banque_id = b.id
     WHERE d.is_verified = FALSE AND d.source = 'communaute'
     ORDER BY d.created_at DESC`
  );

const approuverProposition = (id) =>
  db.query(
    `UPDATE dabs SET is_verified = TRUE WHERE id = $1 AND is_verified = FALSE RETURNING *`,
    [id]
  );

const rejeterProposition = (id) =>
  db.query(
    `DELETE FROM dabs WHERE id = $1 AND is_verified = FALSE RETURNING id`,
    [id]
  );

const update = (id, fields) => {
  const allowed = ['nom', 'adresse', 'latitude', 'longitude', 'statut', 'banque_id', 'type_lieu'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return Promise.resolve({ rows: [], rowCount: 0 });
  params.push(id);
  return db.query(
    `UPDATE dabs SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
};

const remove = (id) =>
  db.query('DELETE FROM dabs WHERE id = $1 RETURNING id', [id]);

const updateEtatCommunautaire = (id, etat) =>
  db.query(
    `UPDATE dabs
     SET etat_communautaire = $1, etat_communautaire_at = NOW()
     WHERE id = $2`,
    [etat, id]
  );

const updateNbVotes = (id, nb) =>
  db.query('UPDATE dabs SET nb_votes_actifs = $1 WHERE id = $2', [nb, id]);

const resetExpiredEtats = () =>
  db.query(`
    UPDATE dabs
    SET etat_communautaire = NULL, etat_communautaire_at = NULL, nb_votes_actifs = 0
    WHERE etat_communautaire IS NOT NULL
      AND id NOT IN (
        SELECT DISTINCT dab_id FROM signalements WHERE expires_at > NOW()
      )
    RETURNING id
  `);

module.exports = {
  findAll, findNearby, findById, create, propose,
  findPropositions, approuverProposition, rejeterProposition,
  update, remove, updateEtatCommunautaire, updateNbVotes, resetExpiredEtats,
};
