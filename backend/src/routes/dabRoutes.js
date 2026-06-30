const router = require('express').Router();
const {
  getAll, getNearby, getOne, create, update, remove,
  proposer, getPropositions, approuver, rejeter,
} = require('../controllers/dabController');
const { getSignalements, create: createSignalement, resoudre } = require('../controllers/signalementController');
const { getAll: getAvis, create: createAvis, remove: removeAvis } = require('../controllers/avisController');
const authMiddleware = require('../middlewares/authMiddleware');
const { optionalAuthMiddleware } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { signalLimiter, adminBypassSignalLimiter, propositionLimiter, dabsReadLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validateMiddleware');
const { dabCreateValidator, dabUpdateValidator, nearbyValidator, proposerValidator } = require('../validators/dabValidator');
const { signalementValidator } = require('../validators/signalementValidator');
const { avisValidator } = require('../validators/avisValidator');

// DAB publics
router.get('/',        dabsReadLimiter, getAll);
router.get('/nearby',  dabsReadLimiter, nearbyValidator, validate, getNearby);

// Proposition communautaire (anonyme, rate-limited)
router.post('/proposer', propositionLimiter, proposerValidator, validate, proposer);

// Gestion admin des propositions
router.get('/propositions',           authMiddleware, requireAdmin, getPropositions);
router.post('/propositions/:id/approuver', authMiddleware, requireAdmin, approuver);
router.delete('/propositions/:id/rejeter', authMiddleware, requireAdmin, rejeter);

// DAB admin (CRUD)
router.post('/',       authMiddleware, requireAdmin, dabCreateValidator, validate, create);
router.put('/:id',     authMiddleware, requireAdmin, dabUpdateValidator, validate, update);
router.delete('/:id',  authMiddleware, requireAdmin, remove);

// DAB détail (doit être après les routes statiques pour éviter les conflits)
router.get('/:id',     getOne);

// Signalements (anonymes)
router.get('/:id/signalements',           getSignalements);
router.post('/:id/signalements',          optionalAuthMiddleware, adminBypassSignalLimiter, signalementValidator, validate, createSignalement);
router.post('/:id/signalements/resoudre', authMiddleware, requireAdmin, resoudre);

// Avis (authentifiés)
router.get('/:id/avis',            getAvis);
router.post('/:id/avis',           authMiddleware, avisValidator, validate, createAvis);
router.delete('/:id/avis/:avisId', authMiddleware, removeAvis);

module.exports = router;
