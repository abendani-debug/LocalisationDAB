jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
// Désactiver tous les rate limiters pour ne pas interférer avec les tests
const noopMiddleware = (req, res, next) => next();
jest.mock('../src/middlewares/rateLimiter', () => ({
  globalLimiter:     (req, res, next) => next(),
  authLimiter:       (req, res, next) => next(),
  signalLimiter:     (req, res, next) => next(),
  propositionLimiter:(req, res, next) => next(),
  dabsReadLimiter:   (req, res, next) => next(),
}));

const mockEmit = jest.fn();
const mockTo   = jest.fn().mockReturnThis();
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ emit: mockEmit, to: mockTo })),
}));

jest.mock('../src/models/Signalement');
jest.mock('../src/models/DAB');
jest.mock('../src/models/HistoriqueStatut');

const request      = require('supertest');
const jwt          = require('jsonwebtoken');
const app          = require('../src/app');
const Signalement  = require('../src/models/Signalement');
const DAB          = require('../src/models/DAB');
const HistoriqueStatut = require('../src/models/HistoriqueStatut');
const db           = require('../src/config/db');
const { env }      = require('../src/config/env');

const makeAdminToken = () =>
  jwt.sign({ userId: 99, role: 'admin' }, env.JWT_SECRET, { expiresIn: '1h' });

const fakeDAB = {
  id: 1, nom: 'DAB Test', statut: 'actif', is_verified: true,
  etat_communautaire: null, nb_votes_actifs: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockEmit.mockClear();
  mockTo.mockClear();
  HistoriqueStatut.create.mockResolvedValue({ rows: [] });
});

describe('GET /api/dabs/:id/signalements', () => {
  it('retourne les votes actifs groupés par état', async () => {
    Signalement.getActiveVotes.mockResolvedValue({
      rows: [
        { etat: 'disponible', count: 3 },
        { etat: 'vide', count: 1 },
      ],
    });

    const res = await request(app).get('/api/dabs/1/signalements');

    expect(res.status).toBe(200);
    expect(res.body.data.votes.disponible).toBe(3);
    expect(res.body.data.votes.vide).toBe(1);
    expect(res.body.data.votes.en_panne).toBe(0);
    expect(res.body.data.totalVotes).toBe(4);
  });

  it('retourne 0 partout si aucun vote actif', async () => {
    Signalement.getActiveVotes.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/dabs/1/signalements');

    expect(res.status).toBe(200);
    expect(res.body.data.totalVotes).toBe(0);
  });
});

describe('POST /api/dabs/:id/signalements (anonyme)', () => {
  it('enregistre un signalement et retourne les votes mis à jour', async () => {
    DAB.findById.mockResolvedValue({ rows: [fakeDAB] });
    Signalement.findExisting.mockResolvedValue({ rows: [] });
    Signalement.create.mockResolvedValue({ rows: [] });
    Signalement.getActiveVotes.mockResolvedValue({
      rows: [{ etat: 'disponible', count: 1 }],
    });
    DAB.updateNbVotes.mockResolvedValue({});

    const res = await request(app)
      .post('/api/dabs/1/signalements')
      .send({ etat: 'disponible', cookieId: '550e8400-e29b-41d4-a716-446655440001', userLat: 36.7372, userLng: 3.0865 });

    expect(res.status).toBe(201);
    expect(res.body.data.votes.disponible).toBe(1);
    expect(res.body.data.totalVotes).toBe(1);
    expect(mockEmit).toHaveBeenCalledWith('dab_update', expect.objectContaining({ dabId: 1 }));
  });

  it('retourne 429 si déjà signalé (anti-spam)', async () => {
    DAB.findById.mockResolvedValue({ rows: [fakeDAB] });
    Signalement.findExisting.mockResolvedValue({
      rows: [{ id: 5, dab_id: 1, etat: 'vide' }],
    });

    const res = await request(app)
      .post('/api/dabs/1/signalements')
      .send({ etat: 'vide', cookieId: '550e8400-e29b-41d4-a716-446655440001', userLat: 36.7372, userLng: 3.0865 });

    expect(res.status).toBe(429);
    expect(Signalement.create).not.toHaveBeenCalled();
  });

  it('retourne 404 si le DAB n\'existe pas', async () => {
    DAB.findById.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/dabs/999/signalements')
      .send({ etat: 'disponible', cookieId: '550e8400-e29b-41d4-a716-446655440001', userLat: 36.7372, userLng: 3.0865 });

    expect(res.status).toBe(404);
  });

  it('retourne 422 si état invalide', async () => {
    const res = await request(app)
      .post('/api/dabs/1/signalements')
      .send({ etat: 'invalide', cookieId: '550e8400-e29b-41d4-a716-446655440001' });

    expect(res.status).toBe(422);
  });

  it('met à jour etat_communautaire quand le seuil est atteint', async () => {
    // SIGNALEMENT_SEUIL = 2 (défini dans setup.js)
    DAB.findById.mockResolvedValue({ rows: [{ ...fakeDAB, etat_communautaire: null }] });
    Signalement.findExisting.mockResolvedValue({ rows: [] });
    Signalement.create.mockResolvedValue({ rows: [] });
    Signalement.getActiveVotes.mockResolvedValue({
      rows: [{ etat: 'vide', count: 2 }],
    });
    DAB.updateEtatCommunautaire.mockResolvedValue({});
    DAB.updateNbVotes.mockResolvedValue({});

    const res = await request(app)
      .post('/api/dabs/1/signalements')
      .send({ etat: 'vide', cookieId: '550e8400-e29b-41d4-a716-446655440002', userLat: 36.7372, userLng: 3.0865 });

    expect(res.status).toBe(201);
    expect(DAB.updateEtatCommunautaire).toHaveBeenCalledWith('1', 'vide');
    expect(HistoriqueStatut.create).toHaveBeenCalledWith(
      '1', 'etat_communautaire', null, 'vide', 'communaute'
    );
    expect(mockTo).toHaveBeenCalledWith('dab_1');
  });

  it('ne déclenche pas updateEtatCommunautaire avec 1 seul vote', async () => {
    DAB.findById.mockResolvedValue({ rows: [{ ...fakeDAB, etat_communautaire: null }] });
    Signalement.findExisting.mockResolvedValue({ rows: [] });
    Signalement.create.mockResolvedValue({ rows: [] });
    Signalement.getActiveVotes.mockResolvedValue({
      rows: [{ etat: 'en_panne', count: 1 }],
    });
    DAB.updateNbVotes.mockResolvedValue({});

    const res = await request(app)
      .post('/api/dabs/1/signalements')
      .send({ etat: 'en_panne', cookieId: '550e8400-e29b-41d4-a716-446655440003', userLat: 36.7372, userLng: 3.0865 });

    expect(res.status).toBe(201);
    expect(DAB.updateEtatCommunautaire).not.toHaveBeenCalled();
  });
});

describe('POST /api/dabs/:id/signalements/resoudre (admin)', () => {
  it('remet etat_communautaire à null et nb_votes à 0', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 99, nom: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true }] });
    DAB.findById.mockResolvedValue({ rows: [{ ...fakeDAB, etat_communautaire: 'vide' }] });
    DAB.updateEtatCommunautaire.mockResolvedValue({});
    DAB.updateNbVotes.mockResolvedValue({});

    const res = await request(app)
      .post('/api/dabs/1/signalements/resoudre')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(200);
    expect(DAB.updateEtatCommunautaire).toHaveBeenCalledWith('1', null);
    expect(DAB.updateNbVotes).toHaveBeenCalledWith('1', 0);
    expect(mockEmit).toHaveBeenCalledWith('dab_update', expect.objectContaining({
      dabId: 1, etatCommunautaire: null, totalVotes: 0,
    }));
  });

  it('retourne 404 si DAB inexistant', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 99, nom: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true }] });
    DAB.findById.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/dabs/999/signalements/resoudre')
      .set('Authorization', `Bearer ${makeAdminToken()}`);

    expect(res.status).toBe(404);
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/api/dabs/1/signalements/resoudre');

    expect(res.status).toBe(401);
  });
});
