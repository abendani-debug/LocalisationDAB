require('express-async-errors');
const EmbedToken = require('../models/EmbedToken');
const DAB = require('../models/DAB');
const StatsService = require('../models/StatsService');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const validateToken = async (token, req) => {
  let result;
  try {
    result = await EmbedToken.findByToken(token);
  } catch {
    return null;
  }
  if (!result.rows.length) return null;
  const t = result.rows[0];
  if (!t.is_active) return null;
  if (new Date(t.trial_ends_at) < new Date()) return null;

  if (t.allowed_domains && t.allowed_domains.length > 0) {
    const referer = req.headers.referer || req.headers.origin || '';
    const allowed = t.allowed_domains.some((d) => referer.includes(d));
    if (!allowed) return null;
  }
  return t;
};

const getDabs = async (req, res) => {
  const { token } = req.params;
  const embedToken = await validateToken(token, req);
  if (!embedToken) return errorResponse(res, 'Token invalide ou expiré.', 403);

  const result = await DAB.findByBanque(embedToken.banque_id);
  return successResponse(res, {
    banque: { id: embedToken.banque_id, nom: embedToken.banque_nom },
    dabs: result.rows,
  });
};

const getStats = async (req, res) => {
  const { token } = req.params;
  const embedToken = await validateToken(token, req);
  if (!embedToken) return errorResponse(res, 'Token invalide ou expiré.', 403);

  const period = req.query.period || '30';
  const stats = await StatsService.getStatsBanque(embedToken.banque_id, period);
  if (!stats) return errorResponse(res, 'Banque introuvable.', 404);
  return successResponse(res, { period, ...stats });
};

const listTokens = async (req, res) => {
  const result = await EmbedToken.findAll();
  return successResponse(res, result.rows);
};

const createToken = async (req, res) => {
  const { banque_id, label, allowed_domains } = req.body;
  if (!banque_id || !label) return errorResponse(res, 'banque_id et label requis.', 400);
  const result = await EmbedToken.create(banque_id, label, allowed_domains);
  return successResponse(res, result.rows[0], 201, 'Token créé.');
};

const toggleToken = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== 'boolean') return errorResponse(res, 'is_active (boolean) requis.', 400);
  const result = await EmbedToken.setActive(id, is_active);
  if (!result.rows.length) return errorResponse(res, 'Token introuvable.', 404);
  return successResponse(res, result.rows[0]);
};

const extendToken = async (req, res) => {
  const { id } = req.params;
  const { days } = req.body;
  if (!days || days < 1) return errorResponse(res, 'days (entier > 0) requis.', 400);
  const result = await EmbedToken.extendTrial(id, days);
  if (!result.rows.length) return errorResponse(res, 'Token introuvable.', 404);
  return successResponse(res, result.rows[0], 200, `Essai prolongé de ${days} jours.`);
};

module.exports = { getDabs, getStats, listTokens, createToken, toggleToken, extendToken };
