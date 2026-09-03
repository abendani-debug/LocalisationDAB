const db = require('../config/db');
const { env } = require('../config/env');

const getActiveVotes = (dabId) =>
  db.query(
    `SELECT etat, COUNT(*)::int AS count
     FROM signalements
     WHERE dab_id = $1 AND expires_at > NOW()
     GROUP BY etat`,
    [dabId]
  );

const findExisting = (dabId, ipHash, cookieId) =>
  db.query(
    `SELECT id, etat, nb_updates FROM signalements
     WHERE dab_id = $1
       AND expires_at > NOW()
       AND (ip_hash = $2 OR cookie_id = $3)`,
    [dabId, ipHash, cookieId]
  );

const updateEtat = (id, nouvelEtat) =>
  db.query(
    `UPDATE signalements
     SET etat = $2, nb_updates = nb_updates + 1
     WHERE id = $1`,
    [id, nouvelEtat]
  );

const create = (dabId, etat, ipHash, cookieId, isAdmin = false) => {
  const dureeHeures = isAdmin ? 24 : env.SIGNALEMENT_DUREE_HEURES;
  const expiresAt = new Date(
    Date.now() + dureeHeures * 60 * 60 * 1000
  ).toISOString();
  return db.query(
    `INSERT INTO signalements (dab_id, etat, ip_hash, cookie_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (dab_id, ip_hash) DO UPDATE SET
       etat = EXCLUDED.etat,
       cookie_id = EXCLUDED.cookie_id,
       created_at = NOW(),
       expires_at = EXCLUDED.expires_at
     RETURNING *`,
    [dabId, etat, ipHash, cookieId, expiresAt]
  );
};

const deleteExpired = () =>
  db.query(`
    WITH expired AS (
      DELETE FROM signalements WHERE expires_at <= NOW() RETURNING dab_id, etat, created_at
    )
    INSERT INTO signalements_archive (dab_id, etat, created_at)
    SELECT dab_id, etat, created_at FROM expired
  `);

const countByDab = (dabId) =>
  db.query(
    `SELECT COUNT(*)::int AS total
     FROM signalements WHERE dab_id = $1 AND expires_at > NOW()`,
    [dabId]
  );

module.exports = { getActiveVotes, findExisting, create, updateEtat, deleteExpired, countByDab };
