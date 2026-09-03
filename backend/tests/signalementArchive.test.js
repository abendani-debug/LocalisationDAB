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
