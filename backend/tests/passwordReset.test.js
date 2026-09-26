jest.mock('../src/config/db', () => ({ query: jest.fn() }));
jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../src/utils/osmImport', () => ({ syncGooglePlaces: jest.fn() }));
jest.mock('../src/config/socket', () => ({
  initSocket: jest.fn(),
  getIO: jest.fn(() => ({ emit: jest.fn(), to: jest.fn().mockReturnThis() })),
}));
jest.mock('../src/models/User');
jest.mock('../src/models/PasswordResetToken');
jest.mock('../src/utils/emailService');

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const PasswordResetToken = require('../src/models/PasswordResetToken');
const emailService = require('../src/utils/emailService');

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renvoie un message générique si l\'email existe', async () => {
    User.findByEmail.mockResolvedValue({
      rows: [{ id: 1, email: 'alice@test.com', is_active: true }],
    });
    PasswordResetToken.invalidateAllForUser.mockResolvedValue({});
    PasswordResetToken.create.mockResolvedValue('faketoken123');
    emailService.sendPasswordResetEmail.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/lien de réinitialisation/i);
    expect(PasswordResetToken.create).toHaveBeenCalledWith(1);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('alice@test.com', 'faketoken123');
  });

  it('renvoie le même message générique si l\'email n\'existe pas (anti-énumération)', async () => {
    User.findByEmail.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'inconnu@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/lien de réinitialisation/i);
    expect(PasswordResetToken.create).not.toHaveBeenCalled();
  });

  it('renvoie le même message générique si le compte est inactif (anti-énumération)', async () => {
    User.findByEmail.mockResolvedValue({
      rows: [{ id: 1, email: 'alice@test.com', is_active: false }],
    });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/lien de réinitialisation/i);
    expect(PasswordResetToken.create).not.toHaveBeenCalled();
  });

  it('ne plante pas si l\'envoi d\'email échoue', async () => {
    User.findByEmail.mockResolvedValue({
      rows: [{ id: 1, email: 'alice@test.com', is_active: true }],
    });
    PasswordResetToken.invalidateAllForUser.mockResolvedValue({});
    PasswordResetToken.create.mockResolvedValue('faketoken123');
    emailService.sendPasswordResetEmail.mockRejectedValue(new Error('RESEND_API_KEY non configurée'));

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@test.com' });

    expect(res.status).toBe(200);
  });

  it('retourne 422 si email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'pas-un-email' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('réinitialise le mot de passe avec un token valide', async () => {
    PasswordResetToken.findValidByToken.mockResolvedValue({
      rows: [{ id: 5, user_id: 1 }],
    });
    User.updatePassword.mockResolvedValue({ rowCount: 1 });
    PasswordResetToken.markUsed.mockResolvedValue({});

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'validtoken', newPassword: 'NouveauPass1!' });

    expect(res.status).toBe(200);
    expect(User.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
    expect(PasswordResetToken.markUsed).toHaveBeenCalledWith(5);
  });

  it('retourne 400 si le token est invalide ou expiré', async () => {
    PasswordResetToken.findValidByToken.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'tokeninvalide', newPassword: 'NouveauPass1!' });

    expect(res.status).toBe(400);
    expect(User.updatePassword).not.toHaveBeenCalled();
  });

  it('retourne 422 si le nouveau mot de passe ne respecte pas la politique', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'validtoken', newPassword: 'faible' });

    expect(res.status).toBe(422);
  });
});
