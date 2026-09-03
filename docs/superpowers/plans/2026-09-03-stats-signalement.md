# Stats de signalement par banque et par DAB — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des statistiques de signalement (taux de disponibilité, volume, tendance, DAB les plus problématiques) agrégées par banque, consultables par l'admin MapsDab et par une banque partenaire via son token embed.

**Architecture:** Une nouvelle table `signalements_archive` conserve l'historique des votes avant leur suppression par le cron existant (`Signalement.deleteExpired`). Toute la logique d'agrégation vit dans un nouveau modèle `StatsService.js`, appelé par deux routes admin (`/api/admin/stats/banques[/:id]`) et une route embed (`/api/embed/:token/stats`) qui réutilise la validation de token déjà écrite. Le frontend ajoute une page admin comparative et une page embed scopée à une banque, toutes deux avec des courbes Recharts.

**Tech Stack:** Node.js/Express, PostgreSQL, express-validator, Jest/Supertest, React, Recharts

**Full spec:** `docs/superpowers/specs/2026-09-03-stats-signalement-design.md`

---

## Fichiers créés / modifiés

### Backend
| Fichier | Action | Rôle |
|---|---|---|
| `backend/migrations/006_signalements_archive.sql` | Créer | Table `signalements_archive` |
| `backend/src/models/Signalement.js` | Modifier | `deleteExpired()` archive avant suppression |
| `backend/src/models/StatsService.js` | Créer | Agrégations SQL (banque unique + toutes banques) |
| `backend/src/validators/statsValidator.js` | Créer | Validation du paramètre `period` |
| `backend/src/app.js` | Modifier | 2 routes admin stats |
| `backend/src/controllers/embedController.js` | Modifier | Ajout `getStats` |
| `backend/src/routes/embedRoutes.js` | Modifier | Route `/:token/stats` |
| `backend/tests/signalementArchive.test.js` | Créer | Test archivage atomique |
| `backend/tests/statsService.test.js` | Créer | Tests unitaires agrégations |
| `backend/tests/adminStats.test.js` | Créer | Tests routes admin |
| `backend/tests/embedStats.test.js` | Créer | Tests route embed |

### Frontend
| Fichier | Action | Rôle |
|---|---|---|
| `frontend/package.json` | Modifier | Ajout dépendance `recharts` |
| `frontend/src/pages/admin/AdminStatsBanques.jsx` | Créer | Vue comparative + drill-down par banque |
| `frontend/src/pages/EmbedStatsPage.jsx` | Créer | Vue stats scopée à une banque (token) |
| `frontend/src/App.jsx` | Modifier | 2 nouvelles routes |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Modifier | Lien vers la nouvelle page admin |

---

## Task 1 — Migration BDD : table `signalements_archive`

**Files:**
- Create: `backend/migrations/006_signalements_archive.sql`

- [ ] **Créer le fichier de migration**

```sql
-- 006_signalements_archive.sql
CREATE TABLE IF NOT EXISTS signalements_archive (
  id          SERIAL PRIMARY KEY,
  dab_id      INTEGER     NOT NULL REFERENCES dabs(id) ON DELETE CASCADE,
  etat        VARCHAR(20) NOT NULL,
  source      VARCHAR(20) NOT NULL DEFAULT 'communaute',
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archive_dab     ON signalements_archive (dab_id);
CREATE INDEX IF NOT EXISTS idx_archive_created ON signalements_archive (created_at);
```

- [ ] **Appliquer la migration en local**

```bash
psql $DATABASE_URL -f backend/migrations/006_signalements_archive.sql
```

Résultat attendu : `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`

- [ ] **Vérifier la table**

```bash
psql $DATABASE_URL -c "\d signalements_archive"
```

Résultat attendu : table avec colonnes `id, dab_id, etat, source, created_at` et les deux index

- [ ] **Commit**

```bash
git add backend/migrations/006_signalements_archive.sql
git commit -m "feat(db): migration 006 — table signalements_archive"
```

---

## Task 2 — Archivage atomique dans `Signalement.deleteExpired()`

**Files:**
- Modify: `backend/src/models/Signalement.js:48-49`
- Test: `backend/tests/signalementArchive.test.js`

- [ ] **Step 1 : Créer le test (doit échouer contre l'implémentation actuelle)**

Créer `backend/tests/signalementArchive.test.js` :

```js
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');
const Signalement = require('../src/models/Signalement');

describe('Signalement.deleteExpired', () => {
  beforeEach(() => jest.clearAllMocks());

  it('archive les votes expirés dans signalements_archive avant suppression, en une seule requête atomique', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await Signalement.deleteExpired();

    expect(db.query).toHaveBeenCalledTimes(1);
    const sql = db.query.mock.calls[0][0];
    expect(sql).toMatch(/DELETE FROM signalements/);
    expect(sql).toMatch(/INSERT INTO signalements_archive/);
  });
});
```

- [ ] **Step 2 : Lancer le test et vérifier qu'il échoue**

```bash
cd backend && npx jest tests/signalementArchive.test.js
```

Résultat attendu : `FAIL` — la requête actuelle ne contient pas `INSERT INTO signalements_archive`

- [ ] **Step 3 : Modifier `deleteExpired()`**

Dans `backend/src/models/Signalement.js`, remplacer :

```js
const deleteExpired = () =>
  db.query('DELETE FROM signalements WHERE expires_at <= NOW()');
```

Par :

```js
const deleteExpired = () =>
  db.query(`
    WITH expired AS (
      DELETE FROM signalements WHERE expires_at <= NOW() RETURNING dab_id, etat, created_at
    )
    INSERT INTO signalements_archive (dab_id, etat, created_at)
    SELECT dab_id, etat, created_at FROM expired
  `);
```

- [ ] **Step 4 : Lancer le test et vérifier qu'il passe**

```bash
cd backend && npx jest tests/signalementArchive.test.js
```

Résultat attendu : `PASS`

- [ ] **Step 5 : Lancer toute la suite pour vérifier l'absence de régression**

```bash
cd backend && npm test
```

Résultat attendu : tous les tests passent (le mock global `jest.mock('../src/models/Signalement')` dans `signalement.test.js` n'est pas affecté par ce changement d'implémentation)

- [ ] **Step 6 : Commit**

```bash
git add backend/src/models/Signalement.js backend/tests/signalementArchive.test.js
git commit -m "feat(backend): archiver les signalements expirés avant suppression"
```

---

## Task 3 — `StatsService.js` : agrégations SQL

**Files:**
- Create: `backend/src/models/StatsService.js`
- Test: `backend/tests/statsService.test.js`

- [ ] **Step 1 : Créer le test**

Créer `backend/tests/statsService.test.js` :

```js
jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const db = require('../src/config/db');
const StatsService = require('../src/models/StatsService');

describe('StatsService.periodToSince', () => {
  it('retourne null pour "all"', () => {
    expect(StatsService.periodToSince('all')).toBeNull();
  });

  it('retourne null pour une valeur inconnue', () => {
    expect(StatsService.periodToSince('999')).toBeNull();
  });

  it('retourne une date ~30 jours dans le passé pour "30"', () => {
    const since = StatsService.periodToSince('30');
    const diffDays = (Date.now() - since.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(29.9);
    expect(diffDays).toBeLessThan(30.1);
  });
});

describe('StatsService.getStatsBanque', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retourne null si la banque n\'existe pas', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await StatsService.getStatsBanque(999, '30');

    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('retourne les stats agrégées pour une banque existante', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nom: 'CPA' }] })
      .mockResolvedValueOnce({ rows: [{ etat: 'disponible', total: 8 }, { etat: 'vide', total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ jour: '2026-09-01', etat: 'disponible', total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, nom: 'DAB X', adresse: 'Rue Y', total_negatif: 4 }] });

    const result = await StatsService.getStatsBanque(1, '30');

    expect(result.banque).toEqual({ id: 1, nom: 'CPA' });
    expect(result.parEtat).toHaveLength(2);
    expect(result.evolution).toHaveLength(1);
    expect(result.topDabProblematiques[0].nom).toBe('DAB X');
  });
});

describe('StatsService.getStatsToutesBanques', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retourne une ligne par banque avec ses totaux', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { banque_id: 1, banque_nom: 'CPA', total_signalements: 10, total_disponible: 8 },
        { banque_id: 2, banque_nom: 'BNA', total_signalements: 5, total_disponible: 1 },
      ],
    });

    const result = await StatsService.getStatsToutesBanques('30');

    expect(result).toHaveLength(2);
    expect(result[0].banque_nom).toBe('CPA');
  });
});
```

- [ ] **Step 2 : Lancer le test et vérifier qu'il échoue**

```bash
cd backend && npx jest tests/statsService.test.js
```

Résultat attendu : `FAIL` avec `Cannot find module '../src/models/StatsService'`

- [ ] **Step 3 : Créer `StatsService.js`**

Créer `backend/src/models/StatsService.js` :

```js
const db = require('../config/db');

const PERIOD_DAYS = { 7: 7, 30: 30, 90: 90 };

const periodToSince = (period) => {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const getStatsBanque = async (banqueId, period = '30') => {
  const since = periodToSince(period);

  const banque = await db.query('SELECT id, nom FROM banques WHERE id = $1', [banqueId]);
  if (!banque.rows.length) return null;

  const parEtat = await db.query(
    `SELECT sa.etat, COUNT(*)::int AS total
     FROM signalements_archive sa
     JOIN dabs d ON d.id = sa.dab_id
     WHERE d.banque_id = $1 AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
     GROUP BY sa.etat`,
    [banqueId, since]
  );

  const evolution = await db.query(
    `SELECT date_trunc('day', sa.created_at)::date AS jour,
            sa.etat, COUNT(*)::int AS total
     FROM signalements_archive sa
     JOIN dabs d ON d.id = sa.dab_id
     WHERE d.banque_id = $1 AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
     GROUP BY jour, sa.etat
     ORDER BY jour ASC`,
    [banqueId, since]
  );

  const topDabProblematiques = await db.query(
    `SELECT d.id, d.nom, d.adresse, COUNT(*)::int AS total_negatif
     FROM signalements_archive sa
     JOIN dabs d ON d.id = sa.dab_id
     WHERE d.banque_id = $1 AND sa.etat IN ('vide', 'en_panne')
       AND ($2::timestamptz IS NULL OR sa.created_at >= $2)
     GROUP BY d.id, d.nom, d.adresse
     ORDER BY total_negatif DESC
     LIMIT 10`,
    [banqueId, since]
  );

  return {
    banque: banque.rows[0],
    parEtat: parEtat.rows,
    evolution: evolution.rows,
    topDabProblematiques: topDabProblematiques.rows,
  };
};

const getStatsToutesBanques = async (period = '30') => {
  const since = periodToSince(period);
  const result = await db.query(
    `SELECT
       b.id AS banque_id, b.nom AS banque_nom,
       COUNT(*)::int AS total_signalements,
       COUNT(*) FILTER (WHERE sa.etat = 'disponible')::int AS total_disponible
     FROM signalements_archive sa
     JOIN dabs d ON d.id = sa.dab_id
     JOIN banques b ON b.id = d.banque_id
     WHERE ($1::timestamptz IS NULL OR sa.created_at >= $1)
     GROUP BY b.id, b.nom
     ORDER BY total_signalements DESC`,
    [since]
  );
  return result.rows;
};

module.exports = { getStatsBanque, getStatsToutesBanques, periodToSince };
```

- [ ] **Step 4 : Lancer le test et vérifier qu'il passe**

```bash
cd backend && npx jest tests/statsService.test.js
```

Résultat attendu : `PASS`

- [ ] **Step 5 : Commit**

```bash
git add backend/src/models/StatsService.js backend/tests/statsService.test.js
git commit -m "feat(backend): modèle StatsService — agrégations signalements par banque"
```

---

## Task 4 — Validator `period`

**Files:**
- Create: `backend/src/validators/statsValidator.js`

- [ ] **Créer le validator**

```js
const { query } = require('express-validator');

const periodValidator = [
  query('period')
    .optional()
    .isIn(['7', '30', '90', 'all']).withMessage('period doit être 7, 30, 90 ou all.'),
];

module.exports = { periodValidator };
```

- [ ] **Vérifier la syntaxe**

```bash
cd backend && node -e "require('./src/validators/statsValidator')" && echo "OK"
```

Résultat attendu : `OK`

- [ ] **Commit**

```bash
git add backend/src/validators/statsValidator.js
git commit -m "feat(backend): validator period pour les routes stats"
```

---

## Task 5 — Routes admin `/api/admin/stats/banques[/:id]`

**Files:**
- Modify: `backend/src/app.js`
- Test: `backend/tests/adminStats.test.js`

- [ ] **Step 1 : Créer le test**

Créer `backend/tests/adminStats.test.js` :

```js
jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
jest.mock('../src/middlewares/rateLimiter', () => ({
  globalLimiter:      (req, res, next) => next(),
  authLimiter:        (req, res, next) => next(),
  signalLimiter:       (req, res, next) => next(),
  propositionLimiter: (req, res, next) => next(),
  dabsReadLimiter:    (req, res, next) => next(),
}));
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ emit: jest.fn(), to: jest.fn().mockReturnThis() })),
}));
jest.mock('../src/models/StatsService');

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../src/app');
const StatsService = require('../src/models/StatsService');
const db      = require('../src/config/db');
const { env } = require('../src/config/env');

const adminUser = { id: 99, nom: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true };

const makeAdminToken = () =>
  jwt.sign({ userId: 99, role: 'admin' }, env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(() => jest.clearAllMocks());

describe('GET /api/admin/stats/banques', () => {
  it('retourne la liste des banques avec taux de disponibilité calculé', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });
    StatsService.getStatsToutesBanques.mockResolvedValue([
      { banque_id: 1, banque_nom: 'CPA', total_signalements: 10, total_disponible: 8 },
    ]);

    const res = await request(app)
      .get('/api/admin/stats/banques')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.banques[0].taux_disponibilite).toBe(80);
    expect(StatsService.getStatsToutesBanques).toHaveBeenCalledWith('30');
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/admin/stats/banques');
    expect(res.status).toBe(401);
  });

  it('retourne 422 si period invalide', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });

    const res = await request(app)
      .get('/api/admin/stats/banques?period=999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(422);
  });
});

describe('GET /api/admin/stats/banques/:id', () => {
  it('retourne le détail d\'une banque', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });
    StatsService.getStatsBanque.mockResolvedValue({
      banque: { id: 1, nom: 'CPA' },
      parEtat: [{ etat: 'disponible', total: 8 }],
      evolution: [],
      topDabProblematiques: [],
    });

    const res = await request(app)
      .get('/api/admin/stats/banques/1')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.banque.nom).toBe('CPA');
    expect(StatsService.getStatsBanque).toHaveBeenCalledWith('1', '30');
  });

  it('retourne 404 si banque introuvable', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });
    StatsService.getStatsBanque.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/admin/stats/banques/999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2 : Lancer le test et vérifier qu'il échoue**

```bash
cd backend && npx jest tests/adminStats.test.js
```

Résultat attendu : `FAIL` — 404 partout, route inexistante

- [ ] **Step 3 : Ajouter les routes dans `app.js`**

Dans `backend/src/app.js`, remplacer la ligne :

```js
const { successResponse } = require('./utils/responseUtils');
```

Par :

```js
const { successResponse, errorResponse } = require('./utils/responseUtils');
const { periodValidator } = require('./validators/statsValidator');
const validate = require('./middlewares/validateMiddleware');
const StatsService = require('./models/StatsService');
```

Puis, juste après la route `app.get('/api/admin/signalements/stats', ...)` (avant `app.post('/api/admin/import-google', ...)`), ajouter :

```js
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
```

- [ ] **Step 4 : Lancer le test et vérifier qu'il passe**

```bash
cd backend && npx jest tests/adminStats.test.js
```

Résultat attendu : `PASS`

- [ ] **Step 5 : Lancer toute la suite**

```bash
cd backend && npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 6 : Commit**

```bash
git add backend/src/app.js backend/tests/adminStats.test.js
git commit -m "feat(backend): routes admin stats/banques"
```

---

## Task 6 — Route embed `/api/embed/:token/stats`

**Files:**
- Modify: `backend/src/controllers/embedController.js`
- Modify: `backend/src/routes/embedRoutes.js`
- Test: `backend/tests/embedStats.test.js`

- [ ] **Step 1 : Créer le test**

Créer `backend/tests/embedStats.test.js` :

```js
jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
jest.mock('../src/middlewares/rateLimiter', () => ({
  globalLimiter:      (req, res, next) => next(),
  authLimiter:        (req, res, next) => next(),
  signalLimiter:       (req, res, next) => next(),
  propositionLimiter: (req, res, next) => next(),
  dabsReadLimiter:    (req, res, next) => next(),
}));
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ emit: jest.fn(), to: jest.fn().mockReturnThis() })),
}));
jest.mock('../src/models/EmbedToken');
jest.mock('../src/models/StatsService');

const request = require('supertest');
const app = require('../src/app');
const EmbedToken = require('../src/models/EmbedToken');
const StatsService = require('../src/models/StatsService');

const activeToken = {
  id: 1, token: 'aaaa-token', banque_id: 7, banque_nom: 'CPA',
  is_active: true,
  trial_ends_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  allowed_domains: null,
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/embed/:token/stats', () => {
  it('retourne les stats de la banque associée au token', async () => {
    EmbedToken.findByToken.mockResolvedValue({ rows: [activeToken] });
    StatsService.getStatsBanque.mockResolvedValue({
      banque: { id: 7, nom: 'CPA' },
      parEtat: [{ etat: 'disponible', total: 5 }],
      evolution: [],
      topDabProblematiques: [],
    });

    const res = await request(app).get('/api/embed/aaaa-token/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.banque.nom).toBe('CPA');
    expect(StatsService.getStatsBanque).toHaveBeenCalledWith(7, '30');
  });

  it('retourne 403 si le token est invalide', async () => {
    EmbedToken.findByToken.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/embed/inconnu/stats');

    expect(res.status).toBe(403);
    expect(StatsService.getStatsBanque).not.toHaveBeenCalled();
  });

  it('retourne 403 si le token est expiré', async () => {
    EmbedToken.findByToken.mockResolvedValue({
      rows: [{ ...activeToken, trial_ends_at: new Date(Date.now() - 1000).toISOString() }],
    });

    const res = await request(app).get('/api/embed/aaaa-token/stats');

    expect(res.status).toBe(403);
  });

  it('accepte le paramètre period', async () => {
    EmbedToken.findByToken.mockResolvedValue({ rows: [activeToken] });
    StatsService.getStatsBanque.mockResolvedValue({
      banque: { id: 7, nom: 'CPA' }, parEtat: [], evolution: [], topDabProblematiques: [],
    });

    const res = await request(app).get('/api/embed/aaaa-token/stats?period=90');

    expect(res.status).toBe(200);
    expect(StatsService.getStatsBanque).toHaveBeenCalledWith(7, '90');
  });

  it('retourne 422 si period invalide', async () => {
    const res = await request(app).get('/api/embed/aaaa-token/stats?period=abc');
    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 2 : Lancer le test et vérifier qu'il échoue**

```bash
cd backend && npx jest tests/embedStats.test.js
```

Résultat attendu : `FAIL` — 404, route inexistante

- [ ] **Step 3 : Ajouter `getStats` dans `embedController.js`**

Dans `backend/src/controllers/embedController.js`, ajouter l'import en haut du fichier :

```js
const StatsService = require('../models/StatsService');
```

Ajouter la fonction après `getDabs` :

```js
const getStats = async (req, res) => {
  const { token } = req.params;
  const embedToken = await validateToken(token, req);
  if (!embedToken) return errorResponse(res, 'Token invalide ou expiré.', 403);

  const period = req.query.period || '30';
  const stats = await StatsService.getStatsBanque(embedToken.banque_id, period);
  if (!stats) return errorResponse(res, 'Banque introuvable.', 404);
  return successResponse(res, { period, ...stats });
};
```

Modifier la ligne d'export finale :

```js
module.exports = { getDabs, getStats, listTokens, createToken, toggleToken, extendToken };
```

- [ ] **Step 4 : Ajouter la route dans `embedRoutes.js`**

Dans `backend/src/routes/embedRoutes.js`, remplacer le contenu par :

```js
const router = require('express').Router();
const {
  getDabs, getStats, listTokens, createToken, toggleToken, extendToken,
} = require('../controllers/embedController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { periodValidator } = require('../validators/statsValidator');
const validate = require('../middlewares/validateMiddleware');

// Routes publiques — appelées par les pages embed frontend
router.get('/:token/dabs',  getDabs);
router.get('/:token/stats', periodValidator, validate, getStats);

// Routes admin — gestion tokens
router.get('/admin/tokens',             authMiddleware, requireAdmin, listTokens);
router.post('/admin/tokens',            authMiddleware, requireAdmin, createToken);
router.patch('/admin/tokens/:id',       authMiddleware, requireAdmin, toggleToken);
router.post('/admin/tokens/:id/extend', authMiddleware, requireAdmin, extendToken);

module.exports = router;
```

- [ ] **Step 5 : Lancer le test et vérifier qu'il passe**

```bash
cd backend && npx jest tests/embedStats.test.js
```

Résultat attendu : `PASS`

- [ ] **Step 6 : Lancer toute la suite**

```bash
cd backend && npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 7 : Commit**

```bash
git add backend/src/controllers/embedController.js backend/src/routes/embedRoutes.js backend/tests/embedStats.test.js
git commit -m "feat(backend): route embed /:token/stats"
```

---

## Task 7 — Installer Recharts

**Files:**
- Modify: `frontend/package.json`

- [ ] **Installer la dépendance**

```bash
cd frontend && npm install recharts
```

- [ ] **Vérifier l'installation**

```bash
cd frontend && node -e "require('recharts'); console.log('OK')"
```

Résultat attendu : `OK`

- [ ] **Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): ajout dépendance recharts"
```

---

## Task 8 — Page admin `AdminStatsBanques.jsx`

**Files:**
- Create: `frontend/src/pages/admin/AdminStatsBanques.jsx`

- [ ] **Créer la page**

```jsx
// frontend/src/pages/admin/AdminStatsBanques.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Spinner from '../../components/UI/Spinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PERIODS = [
  { value: '7',   label: '7 jours' },
  { value: '30',  label: '30 jours' },
  { value: '90',  label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

const ETAT_COLORS = { disponible: '#16a34a', vide: '#dc2626', en_panne: '#f59e0b' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne' };

function pivotEvolution(rows) {
  const byJour = {};
  rows.forEach(({ jour, etat, total }) => {
    const key = jour.slice(0, 10);
    if (!byJour[key]) byJour[key] = { jour: key, disponible: 0, vide: 0, en_panne: 0 };
    byJour[key][etat] = total;
  });
  return Object.values(byJour).sort((a, b) => a.jour.localeCompare(b.jour));
}

export default function AdminStatsBanques() {
  const [period, setPeriod]               = useState('30');
  const [banques, setBanques]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedId, setSelectedId]       = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchBanques = useCallback(() => {
    setLoading(true);
    api.get('/admin/stats/banques', { params: { period } })
      .then((r) => setBanques(r.data.data.banques))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { fetchBanques(); }, [fetchBanques]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    api.get(`/admin/stats/banques/${selectedId}`, { params: { period } })
      .then((r) => setDetail(r.data.data))
      .finally(() => setDetailLoading(false));
  }, [selectedId, period]);

  const evolutionData = detail ? pivotEvolution(detail.evolution) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stats de signalement par banque</h1>
        <Link to="/admin" className="text-sm text-blue-600 hover:underline">← Retour au dashboard</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
              period === p.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Spinner /></div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden mb-8">
          {banques.length === 0 && (
            <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucun signalement sur cette période.</p>
          )}
          {banques.map((b, i) => (
            <button
              key={b.banque_id}
              onClick={() => setSelectedId(b.banque_id)}
              className={`w-full text-left px-5 py-3 flex justify-between items-center cursor-pointer ${
                i < banques.length - 1 ? 'border-b border-slate-100' : ''
              } ${selectedId === b.banque_id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <span className="font-semibold text-gray-900 text-sm">{b.banque_nom}</span>
              <span className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  {b.total_signalements} signalement{b.total_signalements > 1 ? 's' : ''}
                </span>
                <span className={`font-bold ${
                  b.taux_disponibilite === null ? 'text-slate-400'
                    : b.taux_disponibilite >= 70 ? 'text-green-600'
                    : b.taux_disponibilite >= 40 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {b.taux_disponibilite !== null ? `${b.taux_disponibilite}%` : '—'}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          {detailLoading || !detail ? (
            <div className="py-8 flex justify-center"><Spinner /></div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{detail.banque.nom}</h2>

              <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend formatter={(key) => ETAT_LABELS[key] || key} />
                    {Object.keys(ETAT_COLORS).map((etat) => (
                      <Line
                        key={etat}
                        type="monotone"
                        dataKey={etat}
                        stroke={ETAT_COLORS[etat]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                DAB les plus signalés vide/en panne
              </h3>
              {detail.topDabProblematiques.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun signalement négatif sur cette période.</p>
              ) : (
                <div className="space-y-2">
                  {detail.topDabProblematiques.map((d) => (
                    <div key={d.id} className="flex justify-between items-center text-sm px-3 py-2 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{d.nom}</p>
                        <p className="text-xs text-slate-500">{d.adresse}</p>
                      </div>
                      <span className="font-bold text-red-600">{d.total_negatif}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/pages/admin/AdminStatsBanques.jsx
git commit -m "feat(frontend): page admin AdminStatsBanques — comparatif + drill-down"
```

---

## Task 9 — Page embed `EmbedStatsPage.jsx`

**Files:**
- Create: `frontend/src/pages/EmbedStatsPage.jsx`

- [ ] **Créer la page**

```jsx
// frontend/src/pages/EmbedStatsPage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ETAT_COLORS = { disponible: '#16a34a', vide: '#dc2626', en_panne: '#f59e0b' };
const ETAT_LABELS = { disponible: 'Disponible', vide: 'Vide', en_panne: 'En panne' };

function pivotEvolution(rows) {
  const byJour = {};
  rows.forEach(({ jour, etat, total }) => {
    const key = jour.slice(0, 10);
    if (!byJour[key]) byJour[key] = { jour: key, disponible: 0, vide: 0, en_panne: 0 };
    byJour[key][etat] = total;
  });
  return Object.values(byJour).sort((a, b) => a.jour.localeCompare(b.jour));
}

export default function EmbedStatsPage() {
  const { token } = useParams();
  const [stats, setStats]     = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/embed/${token}/stats?period=30`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setError('Token invalide ou expiré.'); return; }
        setStats(json.data);
      })
      .catch(() => setError('Token invalide ou expiré.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
      Chargement…
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#dc2626' }}>
      {error}
    </div>
  );

  const evolutionData = pivotEvolution(stats.evolution);
  const totalNegatif = stats.parEtat
    .filter((e) => e.etat === 'vide' || e.etat === 'en_panne')
    .reduce((sum, e) => sum + e.total, 0);
  const totalDisponible = stats.parEtat.find((e) => e.etat === 'disponible')?.total || 0;
  const total = totalDisponible + totalNegatif;
  const tauxDispo = total > 0 ? Math.round((totalDisponible / total) * 1000) / 10 : null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', fontFamily: 'sans-serif', padding: 24, boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{stats.banque.nom}</h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
        Taux de disponibilité (30 derniers jours) :{' '}
        <strong style={{ color: tauxDispo === null ? '#6b7280' : tauxDispo >= 70 ? '#16a34a' : tauxDispo >= 40 ? '#f59e0b' : '#dc2626' }}>
          {tauxDispo !== null ? `${tauxDispo}%` : '—'}
        </strong>
      </p>

      <div style={{ height: 260, marginBottom: 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend formatter={(key) => ETAT_LABELS[key] || key} />
            {Object.keys(ETAT_COLORS).map((etat) => (
              <Line key={etat} type="monotone" dataKey={etat} stroke={ETAT_COLORS[etat]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', marginBottom: 12 }}>
        Distributeurs les plus signalés vide/en panne
      </h2>
      {stats.topDabProblematiques.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun signalement négatif sur cette période.</p>
      ) : (
        stats.topDabProblematiques.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' }}>{d.nom}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{d.adresse}</p>
            </div>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>{d.total_negatif}</span>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        Propulsé par{' '}
        <a href="https://mapsdab.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          MapsDab
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/pages/EmbedStatsPage.jsx
git commit -m "feat(frontend): page EmbedStatsPage — stats scopées à une banque via token"
```

---

## Task 10 — Intégrer les deux pages dans le router + dashboard

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/admin/AdminDashboard.jsx`

- [ ] **Step 1 : Ajouter les imports dans `App.jsx`**

`recharts` (~90kb gzip) ne doit pas alourdir le bundle des visiteurs de la
carte principale, qui ne passent jamais par ces deux pages. Contrairement
aux autres pages admin du projet (import statique), `AdminStatsBanques` et
`EmbedStatsPage` sont donc chargées en lazy via `React.lazy`, dans un module
dédié à part.

Ajouter en haut de `App.jsx`, avec les autres imports React :

```js
import { lazy, Suspense } from 'react';
```

Ajouter après le dernier import de page statique (`import AboutPage from './pages/AboutPage';`) :

```js
const AdminStatsBanques = lazy(() => import('./pages/admin/AdminStatsBanques'));
const EmbedStatsPage    = lazy(() => import('./pages/EmbedStatsPage'));
```

- [ ] **Step 2 : Ajouter la route admin dans `AppRoutes()`**

Ajouter après la ligne `<Route path="/admin/embed" element={<AdminRoute><AdminEmbedTokens /></AdminRoute>} />` :

```jsx
<Route
  path="/admin/stats-banques"
  element={
    <AdminRoute>
      <Suspense fallback={null}>
        <AdminStatsBanques />
      </Suspense>
    </AdminRoute>
  }
/>
```

- [ ] **Step 3 : Ajouter la route embed dans `App()`**

Dans le bloc `if (isEmbed) { ... }`, remplacer :

```jsx
<Routes>
  <Route path="/embed/:token" element={<EmbedPage />} />
</Routes>
```

Par :

```jsx
<Routes>
  <Route path="/embed/:token" element={<EmbedPage />} />
  <Route
    path="/embed/:token/stats"
    element={
      <Suspense fallback={null}>
        <EmbedStatsPage />
      </Suspense>
    }
  />
</Routes>
```

- [ ] **Step 4 : Ajouter le lien dans `AdminDashboard.jsx`**

Dans `frontend/src/pages/admin/AdminDashboard.jsx`, ajouter après le bouton `🔗 Widgets Embed` :

```jsx
<Link to="/admin/stats-banques" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors">
  📊 Stats banques
</Link>
```

- [ ] **Step 5 : Vérifier que l'app compile**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Résultat attendu : `✓ built in`

- [ ] **Step 6 : Tester manuellement en local**

```bash
cd frontend && npm run dev
```

**Checklist de vérification manuelle :**
- [ ] `http://localhost:5173/admin/stats-banques` (connecté en admin) affiche la liste des banques avec taux de disponibilité
- [ ] Cliquer sur une banque affiche la courbe d'évolution et le classement des DAB problématiques
- [ ] Les boutons de période (7/30/90/Tout) rechargent les données
- [ ] `http://localhost:5173/embed/TOKEN_UUID/stats` (avec un token embed existant) affiche la même vue scopée, sans navbar
- [ ] Un token invalide sur `/embed/xxx/stats` affiche le message d'erreur

- [ ] **Step 7 : Commit**

```bash
git add frontend/src/App.jsx frontend/src/pages/admin/AdminDashboard.jsx
git commit -m "feat(frontend): routes stats-banques (admin + embed) et lien dashboard"
```

---

## Task 11 — Déploiement VPS

**Files:** Aucun — déploiement uniquement. **Ne lancer cette tâche qu'après validation explicite de l'utilisateur.**

- [ ] **Appliquer la migration sur le VPS**

```bash
ssh -i ~/.ssh/claude_vps_key root@164.132.116.135 \
  "psql \$(grep DATABASE_URL /var/www/LocalisationDAB/backend/.env | cut -d= -f2-) \
   -f /var/www/LocalisationDAB/backend/migrations/006_signalements_archive.sql"
```

Résultat attendu : `CREATE TABLE`, `CREATE INDEX`, `CREATE INDEX`

- [ ] **Lancer le deploy.sh**

```bash
ssh -i ~/.ssh/claude_vps_key root@164.132.116.135 \
  "export NVM_DIR=\"\$HOME/.nvm\" && . \"\$NVM_DIR/nvm.sh\" && bash /var/www/LocalisationDAB/deploy.sh"
```

Résultat attendu : `===== Deploy terminé =====` + `localisation-dab` online

- [ ] **Vérifier l'API en prod**

```bash
curl -s -H "Authorization: Bearer <TOKEN_ADMIN>" https://mapsdab.com/api/admin/stats/banques
```

Résultat attendu : `{"success":true,"data":{"period":"30","banques":[...]}}` (probablement vide tant que l'archive n'a pas accumulé de données — c'est attendu, l'archivage ne se déclenche qu'au prochain passage du cron toutes les 30 min)

- [ ] **Vérifier `https://mapsdab.com/admin/stats-banques` dans un navigateur**

- [ ] **Commit final**

```bash
git commit --allow-empty -m "chore: déploiement stats signalement par banque en prod"
```
