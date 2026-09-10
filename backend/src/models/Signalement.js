const db = require('../config/db');
const { env } = require('../config/env');

// Algérie : UTC+1 toute l'année, pas d'heure d'été.
const ALGERIA_UTC_OFFSET_MS = 60 * 60 * 1000;
const WEEKEND_LOCK_DAY = 4;         // jeudi (Date.getUTCDay() : 0=dim..6=sam)
const WEEKEND_LOCK_START_HOUR = 16;
const WEEKEND_LOCK_END_HOUR = 7;    // dimanche 7h
const WEEKEND_LOCK_ETATS = ['vide', 'en_panne'];

/**
 * Un DAB signalé vide/en panne (admin ou utilisateur) le jeudi à partir de 16h
 * (heure Algérie) a de fortes chances de le rester tout le week-end (pas de
 * réapprovisionnement/réparation avant dimanche) — contrairement à un DAB
 * "disponible", qui peut se vider avec l'usage réel pendant le week-end. On
 * étend donc la validité jusqu'à dimanche 7h uniquement pour vide/en_panne ;
 * "disponible" et le reste de la semaine gardent la durée normale.
 */
const computeWeekendLockExpiry = (etat, now) => {
  if (!WEEKEND_LOCK_ETATS.includes(etat)) return null;

  const algeriaNow = new Date(now.getTime() + ALGERIA_UTC_OFFSET_MS);
  const day  = algeriaNow.getUTCDay();
  const hour = algeriaNow.getUTCHours();
  if (day !== WEEKEND_LOCK_DAY || hour < WEEKEND_LOCK_START_HOUR) return null;

  const sundayAlgeria = new Date(Date.UTC(
    algeriaNow.getUTCFullYear(), algeriaNow.getUTCMonth(), algeriaNow.getUTCDate() + 3,
    WEEKEND_LOCK_END_HOUR, 0, 0
  ));
  return new Date(sundayAlgeria.getTime() - ALGERIA_UTC_OFFSET_MS);
};

const computeExpiresAt = (isAdmin, etat, now = new Date()) => {
  const lockExpiry = computeWeekendLockExpiry(etat, now);
  if (lockExpiry) return lockExpiry;
  const dureeHeures = isAdmin ? 24 : env.SIGNALEMENT_DUREE_HEURES;
  return new Date(now.getTime() + dureeHeures * 60 * 60 * 1000);
};

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
  const expiresAt = computeExpiresAt(isAdmin, etat).toISOString();
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

module.exports = { getActiveVotes, findExisting, create, updateEtat, deleteExpired, countByDab, computeExpiresAt };
