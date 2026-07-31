const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { env } = require('../config/env');
const { errorResponse } = require('../utils/responseUtils');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentification requise.', 401);
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return errorResponse(res, 'Token invalide ou expiré.', 401);
  }

  const result = await db.query(
    'SELECT id, nom, email, role, is_active FROM users WHERE id = $1',
    [payload.userId]
  );
  const user = result.rows[0];

  if (!user || !user.is_active) {
    return errorResponse(res, 'Compte introuvable ou désactivé.', 401);
  }

  req.user = user;
  next();
};

// Variante optionnelle : essaie de lire le JWT mais ne bloque jamais si absent
const optionalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const result = await db.query(
      'SELECT id, nom, email, role, is_active FROM users WHERE id = $1',
      [payload.userId]
    );
    const user = result.rows[0];
    if (user?.is_active) req.user = user;
  } catch { /* token invalide ou expiré : on ignore, req.user reste undefined */ }
  next();
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
