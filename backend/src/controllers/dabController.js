require('express-async-errors');
const DAB = require('../models/DAB');
const Service = require('../models/Service');
const HistoriqueStatut = require('../models/HistoriqueStatut');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const getAll = async (req, res) => {
  const { lat, lng, radius, banque_id, statut, page = 1, limit = 20 } = req.query;
  const result = await DAB.findAll({ lat, lng, radius, banque_id, statut, page: +page, limit: +limit });
  return successResponse(res, result.rows);
};

const getNearby = async (req, res) => {
  const { lat, lng, radius = 2, banque_id } = req.query;
  const result = await DAB.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius), banque_id || null);
  return successResponse(res, result.rows);
};

const getOne = async (req, res) => {
  const result = await DAB.findById(req.params.id);
  if (!result.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  const dab = result.rows[0];
  const services = await Service.findByDabId(dab.id);
  dab.services = services.rows;

  return successResponse(res, dab);
};

const create = async (req, res) => {
  const result = await DAB.create(req.body);
  await HistoriqueStatut.create(
    result.rows[0].id, 'statut', null, result.rows[0].statut, 'admin', req.user.id
  );
  return successResponse(res, result.rows[0], 201, 'DAB créé.');
};

const update = async (req, res) => {
  const existing = await DAB.findById(req.params.id);
  if (!existing.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  const ancien = existing.rows[0];
  const result = await DAB.update(req.params.id, req.body);

  if (req.body.statut && req.body.statut !== ancien.statut) {
    await HistoriqueStatut.create(
      req.params.id, 'statut', ancien.statut, req.body.statut, 'admin', req.user.id
    );
  }

  return successResponse(res, result.rows[0], 200, 'DAB mis à jour.');
};

const remove = async (req, res) => {
  const existing = await DAB.findById(req.params.id);
  if (!existing.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  await DAB.remove(req.params.id);
  return successResponse(res, null, 200, 'DAB supprimé.');
};

// ── Propositions communautaires ──────────────────────────────

const proposer = async (req, res) => {
  const { nom, adresse, latitude, longitude, banque_id, type_lieu, country_code } = req.body;
  const result = await DAB.propose({ nom, adresse, latitude, longitude, banque_id, type_lieu, country_code });
  return successResponse(res, result.rows[0], 201,
    'Proposition soumise. Elle sera visible après validation par un administrateur.');
};

const getPropositions = async (req, res) => {
  const result = await DAB.findPropositions();
  return successResponse(res, result.rows);
};

const approuver = async (req, res) => {
  const result = await DAB.approuverProposition(req.params.id);
  if (!result.rows.length) return errorResponse(res, 'Proposition introuvable ou déjà approuvée.', 404);

  await HistoriqueStatut.create(
    req.params.id, 'statut', null, result.rows[0].statut, 'admin', req.user.id
  );
  return successResponse(res, result.rows[0], 200, 'Proposition approuvée.');
};

const rejeter = async (req, res) => {
  const result = await DAB.rejeterProposition(req.params.id);
  if (!result.rows.length) return errorResponse(res, 'Proposition introuvable ou déjà traitée.', 404);
  return successResponse(res, null, 200, 'Proposition rejetée.');
};

module.exports = { getAll, getNearby, getOne, create, update, remove, proposer, getPropositions, approuver, rejeter };
