require('express-async-errors');
const crypto = require('crypto');
const Signalement = require('../models/Signalement');
const DAB = require('../models/DAB');
const HistoriqueStatut = require('../models/HistoriqueStatut');
const { getIO } = require('../config/socket');
const { env } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseUtils');
const { haversineDistance } = require('../utils/geoUtils');

const GEO_LIMIT_KM = 1;

const hashIP = (ip) =>
  crypto.createHmac('sha256', env.IP_SALT).update(ip).digest('hex');

const buildVotesMap = (rows) => {
  const votes = { disponible: 0, vide: 0, en_panne: 0 };
  rows.forEach(({ etat, count }) => { votes[etat] = count; });
  return votes;
};

const determineEtat = (votes, seuil) => {
  for (const [etat, count] of Object.entries(votes)) {
    if (count >= seuil) return etat;
  }
  return null;
};

const getSignalements = async (req, res) => {
  const { id: dabId } = req.params;
  const result = await Signalement.getActiveVotes(dabId);
  const votes = buildVotesMap(result.rows);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  return successResponse(res, { votes, totalVotes: total });
};

const create = async (req, res) => {
  const { id: dabId } = req.params;
  const { etat, cookieId, userLat, userLng } = req.body;

  const dab = await DAB.findById(dabId);
  if (!dab.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  // Vérification distance utilisateur ↔ DAB
  const dabRow = dab.rows[0];
  const distanceKm = haversineDistance(
    parseFloat(userLat),
    parseFloat(userLng),
    parseFloat(dabRow.latitude),
    parseFloat(dabRow.longitude),
  );
  if (distanceKm > GEO_LIMIT_KM) {
    return errorResponse(res, `Vous êtes trop loin de ce DAB (${distanceKm.toFixed(2)} km). Rapprochez-vous à moins de ${GEO_LIMIT_KM} km.`, 403);
  }

  const rawIP = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const ipHash = hashIP(rawIP);

  const existing = await Signalement.findExisting(dabId, ipHash, cookieId);
  let isModification = false;
  const isAdmin = req.user?.role === 'admin';

  if (existing.rows.length) {
    const vote = existing.rows[0];

    // Même état → rien à faire
    if (vote.etat === etat) {
      return errorResponse(res, 'Vous avez déjà signalé cet état pour ce DAB.', 409);
    }
    // Déjà modifié une fois → bloquer (sauf admin)
    if (!isAdmin && vote.nb_updates >= 1) {
      return errorResponse(res, 'Vous avez déjà modifié votre signalement. Une seule modification est autorisée par vote.', 429);
    }
    // Modification autorisée
    await Signalement.updateEtat(vote.id, etat);
    isModification = true;
  } else {
    await Signalement.create(dabId, etat, ipHash, cookieId, isAdmin);
  }

  const votesResult = await Signalement.getActiveVotes(dabId);
  const votes = buildVotesMap(votesResult.rows);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const nouvelEtat = determineEtat(votes, env.SIGNALEMENT_SEUIL);
  const ancienEtat = dabRow.etat_communautaire;

  if (nouvelEtat && nouvelEtat !== ancienEtat) {
    await DAB.updateEtatCommunautaire(dabId, nouvelEtat);
    await HistoriqueStatut.create(dabId, 'etat_communautaire', ancienEtat, nouvelEtat, 'communaute');
    getIO().to(`dab_${dabId}`).emit('dab_statut_change', { dabId: +dabId, etatCommunautaire: nouvelEtat, source: 'communaute', timestamp: new Date().toISOString() });
  }

  await DAB.updateNbVotes(dabId, total);

  getIO().emit('dab_update', {
    dabId: +dabId,
    etatCommunautaire: nouvelEtat || ancienEtat,
    votes,
    totalVotes: total,
    timestamp: new Date().toISOString(),
  });

  const statusCode = isModification ? 200 : 201;
  const message = isModification ? 'Signalement modifié.' : 'Signalement enregistré.';

  return successResponse(res, {
    votes,
    etatCommunautaire: nouvelEtat || ancienEtat,
    totalVotes: total,
    modified: isModification,
  }, statusCode, message);
};

const resoudre = async (req, res) => {
  const { id: dabId } = req.params;
  const dab = await DAB.findById(dabId);
  if (!dab.rows.length) return errorResponse(res, 'DAB introuvable.', 404);

  const ancienEtat = dab.rows[0].etat_communautaire;
  await DAB.updateEtatCommunautaire(dabId, null);
  await DAB.updateNbVotes(dabId, 0);
  await HistoriqueStatut.create(dabId, 'etat_communautaire', ancienEtat, null, 'admin', req.user.id);

  getIO().emit('dab_update', { dabId: +dabId, etatCommunautaire: null, votes: { disponible: 0, vide: 0, en_panne: 0 }, totalVotes: 0, timestamp: new Date().toISOString() });

  return successResponse(res, null, 200, 'Signalements résolus.');
};

module.exports = { getSignalements, create, resoudre };
