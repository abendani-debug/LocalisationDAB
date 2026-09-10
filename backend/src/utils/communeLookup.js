const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const DATASET_PATH = path.join(__dirname, '../../data/dza-adm3-communes.geojson');
const NEAREST_CANDIDATES = 15;

let communes = null;
let communeMeta = null;

/**
 * Charge et précalcule (centroïdes + contours) le jeu de communes une seule fois.
 * Les polygones sans nom (lacune connue du dataset geoBoundaries) sont exclus.
 */
const load = () => {
  if (communes) return;
  const raw = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
  communes = raw.features.filter((f) => f.properties.shapeName);
  communeMeta = communes.map((f) => {
    const centroid = turf.centroid(f);
    const line = turf.polygonToLine(f);
    const lines = line.type === 'FeatureCollection' ? line.features : [line];
    return { name: f.properties.shapeName, centroid, lines };
  });
};

/**
 * Résout la commune algérienne (ADM3) contenant un point GPS.
 * Si aucun polygone ne contient le point (lacune du dataset ou coordonnées en bordure),
 * rattache à la commune la plus proche (présélection par centroïde, puis distance précise au contour).
 * Retourne null si le dataset n'a pas pu être chargé ou en cas d'échec total.
 */
const findCommune = (lng, lat) => {
  load();
  const pt = turf.point([lng, lat]);

  for (const f of communes) {
    if (turf.booleanPointInPolygon(pt, f.geometry)) return f.properties.shapeName;
  }

  const nearestByCentroid = communeMeta
    .map((c) => ({ ...c, centroidDist: turf.distance(pt, c.centroid, { units: 'kilometers' }) }))
    .sort((a, b) => a.centroidDist - b.centroidDist)
    .slice(0, NEAREST_CANDIDATES);

  let best = null;
  let bestDist = Infinity;
  for (const c of nearestByCentroid) {
    for (const l of c.lines) {
      const dist = turf.pointToLineDistance(pt, l, { units: 'kilometers' });
      if (dist < bestDist) {
        bestDist = dist;
        best = c.name;
      }
    }
  }
  return best;
};

module.exports = { findCommune };
