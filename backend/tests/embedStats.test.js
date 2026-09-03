jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
jest.mock('../src/middlewares/rateLimiter', () => ({
  globalLimiter:            (req, res, next) => next(),
  authLimiter:              (req, res, next) => next(),
  signalLimiter:            (req, res, next) => next(),
  adminBypassSignalLimiter: (req, res, next) => next(),
  propositionLimiter:       (req, res, next) => next(),
  dabsReadLimiter:          (req, res, next) => next(),
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

  it('retourne 403 (pas 500) si le token n\'est pas un UUID valide', async () => {
    EmbedToken.findByToken.mockRejectedValue(
      Object.assign(new Error('syntaxe en entrée invalide pour le type uuid'), { code: '22P02' })
    );

    const res = await request(app).get('/api/embed/pas-un-uuid/stats');

    expect(res.status).toBe(403);
  });
});

describe('GET /api/embed/:token/dabs', () => {
  it('retourne 403 (pas 500) si le token n\'est pas un UUID valide', async () => {
    EmbedToken.findByToken.mockRejectedValue(
      Object.assign(new Error('syntaxe en entrée invalide pour le type uuid'), { code: '22P02' })
    );

    const res = await request(app).get('/api/embed/pas-un-uuid/dabs');

    expect(res.status).toBe(403);
  });
});
