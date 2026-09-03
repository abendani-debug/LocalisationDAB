const db = require('../config/db');

// clés numériques coercées en string par JS — period est toujours une string ('7'|'30'|'90'|'all')
const PERIOD_DAYS = { 7: 7, 30: 30, 90: 90 };

const periodToSince = (period) => {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const getStatsBanque = async (banqueId, period = '30') => {
  const since = periodToSince(period);

  const banque = await db.query('SELECT id, nom FROM banques WHERE id = $1', [banqueId]);
  if (!banque.rows.length) return null;

  const [parEtat, evolution, topDabProblematiques] = await Promise.all([
    db.query(
      `SELECT sa.etat, COUNT(*)::int AS total
       FROM signalements_archive sa
       JOIN dabs d ON d.id = sa.dab_id
       WHERE d.banque_id = $1 AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
       GROUP BY sa.etat`,
      [banqueId, since]
    ),
    db.query(
      `SELECT date_trunc('day', sa.created_at)::date AS jour,
              sa.etat, COUNT(*)::int AS total
       FROM signalements_archive sa
       JOIN dabs d ON d.id = sa.dab_id
       WHERE d.banque_id = $1 AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
       GROUP BY jour, sa.etat
       ORDER BY jour ASC`,
      [banqueId, since]
    ),
    db.query(
      `SELECT d.id, d.nom, d.adresse, COUNT(*)::int AS total_negatif
       FROM signalements_archive sa
       JOIN dabs d ON d.id = sa.dab_id
       WHERE d.banque_id = $1 AND sa.etat IN ('vide', 'en_panne')
         AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
       GROUP BY d.id, d.nom, d.adresse
       ORDER BY total_negatif DESC
       LIMIT 10`,
      [banqueId, since]
    ),
  ]);

  return {
    banque: banque.rows[0],
    parEtat: parEtat.rows,
    evolution: evolution.rows,
    topDabProblematiques: topDabProblematiques.rows,
  };
};

const getStatsToutesBanques = async (period = '30') => {
  const since = periodToSince(period);
  const result = await db.query(
    `SELECT
       b.id AS banque_id, b.nom AS banque_nom,
       COUNT(sa.id) FILTER (WHERE $1::timestamptz IS NULL OR sa.created_at >= $1)::int AS total_signalements,
       COUNT(sa.id) FILTER (
         WHERE sa.etat = 'disponible' AND ($1::timestamptz IS NULL OR sa.created_at >= $1)
       )::int AS total_disponible
     FROM banques b
     LEFT JOIN dabs d ON d.banque_id = b.id
     LEFT JOIN signalements_archive sa ON sa.dab_id = d.id
     GROUP BY b.id, b.nom
     ORDER BY total_signalements DESC`,
    [since]
  );
  return result.rows;
};

module.exports = { getStatsBanque, getStatsToutesBanques, periodToSince };
