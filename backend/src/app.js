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
const paysRoutes        = require('./routes/paysRoutes');
const adminPaysRoutes   = require('./routes/adminPaysRoutes');
const embedRoutes       = require('./routes/embedRoutes');

const { syncAll } = require('./utils/osmImport');

const app = express();

// ── Sécurité ────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/embed')) {
    helmet({ frameguard: false })(req, res, next);
  } else {
    helmet()(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/embed')) {
    cors({ origin: '*' })(req, res, next);
  } else {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins, credentials: true })(req, res, next);
  }
});
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
app.use('/api/auth',        authRoutes);
app.use('/api/dabs',        dabRoutes);
app.use('/api/banques',     banqueRoutes);
app.use('/api/services',    serviceRoutes);
app.use('/api/pays',        paysRoutes);
app.use('/api/admin/pays',  adminPaysRoutes);
app.use('/api/embed',       embedRoutes);

// ── Admin stats ──────────────────────────────────────────────
const authMiddleware = require('./middlewares/authMiddleware');
const { requireAdmin } = require('./middlewares/roleMiddleware');
const db = require('./config/db');
const { successResponse, errorResponse } = require('./utils/responseUtils');
const { periodValidator } = require('./validators/statsValidator');
const validate = require('./middlewares/validateMiddleware');
const StatsService = require('./models/StatsService');

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

app.get('/api/admin/stats/banques', authMiddleware, requireAdmin, periodValidator, validate, async (req, res) => {
  const period = req.query.period || '30';
  const rows = await StatsService.getStatsToutesBanques(period);
  const banques = rows.map((r) => ({
    ...r,
    taux_disponibilite: r.total_signalements > 0
      ? Math.round((r.total_disponible / r.total_signalements) * 1000) / 10
      : null,
  }));
  return successResponse(res, { period, banques });
});

app.get('/api/admin/stats/banques/:id', authMiddleware, requireAdmin, periodValidator, validate, async (req, res) => {
  const period = req.query.period || '30';
  const stats = await StatsService.getStatsBanque(req.params.id, period);
  if (!stats) return errorResponse(res, 'Banque introuvable.', 404);
  return successResponse(res, { period, ...stats });
});

app.get('/api/admin/stats/geographie', authMiddleware, requireAdmin, periodValidator, validate, async (req, res) => {
  const period = req.query.period || '30';
  const zones = await StatsService.getStatsGeographie(period);
  return successResponse(res, { period, zones });
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
