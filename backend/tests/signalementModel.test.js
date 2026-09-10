jest.mock('../src/config/db', () => ({ query: jest.fn() }));

const { computeExpiresAt } = require('../src/models/Signalement');

// 2026-09-10 est un jeudi.
const JEUDI_16H   = new Date('2026-09-10T15:00:00.000Z'); // jeudi 16h heure Algérie (UTC+1)
const JEUDI_15H59 = new Date('2026-09-10T14:59:00.000Z'); // jeudi 15h59 heure Algérie
const VENDREDI_16H = new Date('2026-09-11T15:00:00.000Z'); // vendredi 16h heure Algérie

describe('Signalement.computeExpiresAt — verrou week-end (admin et utilisateur)', () => {
  it('étend jusqu\'à dimanche 7h (Algérie) pour un admin/vide le jeudi ≥16h', () => {
    const result = computeExpiresAt(true, 'vide', JEUDI_16H);
    expect(result.toISOString()).toBe('2026-09-13T06:00:00.000Z'); // dimanche 7h Algérie = 6h UTC
  });

  it('étend jusqu\'à dimanche 7h (Algérie) pour un admin/en_panne le jeudi ≥16h', () => {
    const result = computeExpiresAt(true, 'en_panne', JEUDI_16H);
    expect(result.toISOString()).toBe('2026-09-13T06:00:00.000Z');
  });

  it('étend jusqu\'à dimanche 7h (Algérie) pour un utilisateur/vide le jeudi ≥16h', () => {
    const result = computeExpiresAt(false, 'vide', JEUDI_16H);
    expect(result.toISOString()).toBe('2026-09-13T06:00:00.000Z');
  });

  it('étend jusqu\'à dimanche 7h (Algérie) pour un utilisateur/en_panne le jeudi ≥16h', () => {
    const result = computeExpiresAt(false, 'en_panne', JEUDI_16H);
    expect(result.toISOString()).toBe('2026-09-13T06:00:00.000Z');
  });

  it('garde 24h pour un admin/disponible le jeudi ≥16h (pas d\'extension)', () => {
    const result = computeExpiresAt(true, 'disponible', JEUDI_16H);
    expect(result.toISOString()).toBe('2026-09-11T15:00:00.000Z'); // +24h exactement
  });

  it('garde 4h pour un utilisateur/disponible le jeudi ≥16h (pas d\'extension)', () => {
    const result = computeExpiresAt(false, 'disponible', JEUDI_16H);
    // env.SIGNALEMENT_DUREE_HEURES = 4 dans tests/setup.js
    expect(result.toISOString()).toBe('2026-09-10T19:00:00.000Z');
  });

  it('garde 24h pour un admin/vide le jeudi avant 16h', () => {
    const result = computeExpiresAt(true, 'vide', JEUDI_15H59);
    expect(result.toISOString()).toBe('2026-09-11T14:59:00.000Z');
  });

  it('garde 4h pour un utilisateur/vide le jeudi avant 16h', () => {
    const result = computeExpiresAt(false, 'vide', JEUDI_15H59);
    expect(result.toISOString()).toBe('2026-09-10T18:59:00.000Z');
  });

  it('garde la durée normale pour vide un autre jour que jeudi (admin et utilisateur)', () => {
    expect(computeExpiresAt(true, 'vide', VENDREDI_16H).toISOString()).toBe('2026-09-12T15:00:00.000Z');
    expect(computeExpiresAt(false, 'vide', VENDREDI_16H).toISOString()).toBe('2026-09-11T19:00:00.000Z');
  });
});
