jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
jest.mock('../src/middlewares/rateLimiter', () => ({
  globalLimiter:      (req, res, next) => next(),
  authLimiter:        (req, res, next) => next(),
  signalLimiter:       (req, res, next) => next(),
  adminBypassSignalLimiter: (req, res, next) => next(),
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

describe('GET /api/admin/stats/geographie', () => {
  it('retourne les zones géographiques triées par signalements', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });
    StatsService.getStatsGeographie.mockResolvedValue([
      { country_code: 'DZ', pays_nom: 'Algérie', ville: 'Oran', total: 3 },
    ]);

    const res = await request(app)
      .get('/api/admin/stats/geographie')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.zones[0].ville).toBe('Oran');
    expect(StatsService.getStatsGeographie).toHaveBeenCalledWith('30');
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/admin/stats/geographie');
    expect(res.status).toBe(401);
  });

  it('retourne 422 si period invalide', async () => {
    db.query.mockResolvedValue({ rows: [adminUser] });

    const res = await request(app)
      .get('/api/admin/stats/geographie?period=999')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(422);
  });
});
