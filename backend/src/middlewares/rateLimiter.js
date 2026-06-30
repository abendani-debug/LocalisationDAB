const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseUtils');

const handler = (req, res) =>
  errorResponse(res, 'Trop de requêtes, veuillez réessayer plus tard.', 429);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Lectures carte : généreux car la carte peut rafraîchir souvent
const dabsReadLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 300,              // 300 req/min par IP (5/sec)
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

const signalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Propositions communautaires : max 10 par heure par IP
const propositionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Signalement : bypasse le rate limit si l'utilisateur est admin authentifié
const adminBypassSignalLimiter = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return signalLimiter(req, res, next);
};

module.exports = { globalLimiter, authLimiter, signalLimiter, adminBypassSignalLimiter, propositionLimiter, dabsReadLimiter };
