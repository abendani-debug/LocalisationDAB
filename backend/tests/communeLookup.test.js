const { findCommune } = require('../src/utils/communeLookup');

describe('communeLookup.findCommune', () => {
  it('résout une commune par correspondance exacte (point-dans-polygone)', () => {
    expect(findCommune(3.0401827, 36.7468715)).toBe('Hydra');
  });

  it('rattache à la commune la plus proche quand aucun polygone ne contient le point', () => {
    expect(findCommune(4.1867520, 36.5322476)).toBe('Ouacif');
  });

  it('retourne un nom de commune pour des coordonnées algériennes courantes (Oran)', () => {
    expect(findCommune(-0.6331, 35.6969)).toBe('Oran');
  });
});
