require('express-async-errors');
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const cron    = require('node-cron');

const { env } = require('./config/env');
const { globalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes        = require('./routes/authRoutes');
const dabRoutes         = require('./routes/dabRoutes');
const banqueRoutes      = require('./routes/banqueRoutes');
const serviceRoutes     = require('./routes/serviceRoutes');

const { syncAll } = require('./utils/osmImport');

const app = express();

// ── Sécurité ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.set('trust proxy', 1);

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate limiting global (hors lectures carte) ───────────────
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/dabs')) return next();
  return globalLimiter(req, res, next);
});

// ── Health check (Railway) ───────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/dabs',     dabRoutes);
app.use('/api/banques',  banqueRoutes);
app.use('/api/services', serviceRoutes);

// ── Admin stats ──────────────────────────────────────────────
const authMiddleware = require('./middlewares/authMiddleware');
const { requireAdmin } = require('./middlewares/roleMiddleware');
const db = require('./config/db');
const { successResponse } = require('./utils/responseUtils');

app.get('/api/admin/stats', authMiddleware, requireAdmin, async (req, res) => {
  const [dabs, users, signalements, propositions] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total, statut FROM dabs WHERE is_verified = TRUE GROUP BY statut'),
    db.query('SELECT COUNT(*)::int AS total FROM users'),
    db.query('SELECT COUNT(*)::int AS total FROM signalements WHERE expires_at > NOW()'),
    db.query('SELECT COUNT(*)::int AS total FROM dabs WHERE is_verified = FALSE'),
  ]);
  return successResponse(res, {
    dabs: dabs.rows,
    users: users.rows[0],
    signalements: signalements.rows[0],
    propositions: propositions.rows[0],
  });
});

app.get('/api/admin/signalements', authMiddleware, requireAdmin, async (req, res) => {
  const result = await db.query(`
    SELECT
      d.id, d.nom, d.adresse, d.etat_communautaire, d.etat_communautaire_at, d.nb_votes_actifs,
      json_object_agg(s.etat, s.nb) FILTER (WHERE s.etat IS NOT NULL) AS votes
    FROM dabs d
    JOIN (
      SELECT dab_id, etat, COUNT(*)::int AS nb
      FROM signalements
      WHERE expires_at > NOW()
      GROUP BY dab_id, etat
    ) s ON s.dab_id = d.id
    GROUP BY d.id, d.nom, d.adresse, d.etat_communautaire, d.etat_communautaire_at, d.nb_votes_actifs
    ORDER BY d.etat_communautaire_at DESC NULLS LAST
  `);
  return successResponse(res, result.rows);
});

app.get('/api/admin/signalements/stats', authMiddleware, requireAdmin, async (req, res) => {
  const stats = await db.query(`
    SELECT
      etat,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE expires_at > NOW())::int AS actifs
    FROM signalements
    GROUP BY etat
    ORDER BY etat
  `);
  const total = await db.query('SELECT COUNT(*)::int AS total FROM signalements');
  const actifs = await db.query('SELECT COUNT(*)::int AS total FROM signalements WHERE expires_at > NOW()');
  return successResponse(res, {
    parEtat: stats.rows,
    totalSignalements: total.rows[0].total,
    signalementsActifs: actifs.rows[0].total,
  });
});

app.post('/api/admin/import-google', authMiddleware, requireAdmin, async (req, res) => {
  const result = await syncAll();
  return successResponse(res, result, 200, 'Import Google Places terminé (Algérie + France).');
});

// ── Cron : import Google Places tous les 3 mois (1er jour de janv/avr/juil/oct à 3h) ──
cron.schedule('0 3 1 1,4,7,10 *', async () => {
  try {
    await syncAll();
  } catch (err) {
    console.error('Cron Google Places error:', err.message);
  }
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

// ── Gestionnaire d'erreurs global ────────────────────────────
app.use(errorHandler);

module.exports = app;
