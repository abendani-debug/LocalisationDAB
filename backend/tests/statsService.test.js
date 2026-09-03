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

  it('part de banques (LEFT JOIN) pour inclure les banques sans signalement', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await StatsService.getStatsToutesBanques('30');

    const sql = db.query.mock.calls[0][0];
    expect(sql).toMatch(/FROM banques b/);
    expect(sql).toMatch(/LEFT JOIN dabs/);
    expect(sql).toMatch(/LEFT JOIN signalements_archive/);
    expect(sql).not.toMatch(/FROM signalements_archive/);
    // Le filtre de période doit vivre dans les FILTER(WHERE ...) des agrégats,
    // jamais dans une clause WHERE globale : avec le LEFT JOIN, une ligne sans
    // signalement a sa.created_at = NULL, et un WHERE global sur cette colonne
    // exclurait silencieusement ces banques (régression exacte de ce fix).
    expect((sql.match(/WHERE/g) || []).length).toBe(2);
    expect(sql).not.toMatch(/LEFT JOIN signalements_archive sa ON sa\.dab_id = d\.id\s+WHERE/);
  });
});
