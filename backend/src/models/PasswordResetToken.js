// backend/src/models/PasswordResetToken.js
const crypto = require('crypto');
const db = require('../config/db');

const ONE_HOUR_MS = 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Invalide tous les tokens encore valides d'un utilisateur (appelé avant
 * d'en créer un nouveau, pour qu'un seul lien de reset soit actif à la fois).
 */
const invalidateAllForUser = (userId) =>
  db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [userId]
  );

/**
 * Crée un nouveau token pour un utilisateur. Retourne le token EN CLAIR
 * (à envoyer par email) — seul son hash est stocké en base.
 */
const create = async (userId, ttlMs = ONE_HOUR_MS) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
};

/**
 * Cherche un token valide (non utilisé, non expiré) à partir du token en
 * clair reçu du client.
 */
const findValidByToken = (token) =>
  db.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [hashToken(token)]
  );

const markUsed = (id) =>
  db.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [id]);

module.exports = { create, invalidateAllForUser, findValidByToken, markUsed, hashToken };
