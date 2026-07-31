const db = require('../config/db');

const findByToken = (token) =>
  db.query(
    `SELECT et.*, b.nom AS banque_nom
     FROM embed_tokens et
     JOIN banques b ON b.id = et.banque_id
     WHERE et.token = $1`,
    [token]
  );

const findAll = () =>
  db.query(
    `SELECT et.*, b.nom AS banque_nom
     FROM embed_tokens et
     JOIN banques b ON b.id = et.banque_id
     ORDER BY et.created_at DESC`
  );

const create = (banqueId, label, allowedDomains) =>
  db.query(
    `INSERT INTO embed_tokens (banque_id, label, allowed_domains)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [banqueId, label, allowedDomains || null]
  );

const setActive = (id, isActive) =>
  db.query(
    `UPDATE embed_tokens SET is_active = $2 WHERE id = $1 RETURNING *`,
    [id, isActive]
  );

const extendTrial = (id, days) =>
  db.query(
    `UPDATE embed_tokens
     SET trial_ends_at = GREATEST(trial_ends_at, NOW()) + ($2 || ' days')::INTERVAL
     WHERE id = $1
     RETURNING *`,
    [id, days]
  );

module.exports = { findByToken, findAll, create, setActive, extendTrial };
