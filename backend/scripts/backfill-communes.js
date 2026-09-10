/**
 * Backfill de la colonne dabs.commune pour tous les DAB algériens existants,
 * via résolution point-dans-polygone sur les limites communales (ADM3).
 * Usage : node scripts/backfill-communes.js  (depuis le dossier backend/)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const db = require('../src/config/db');
const { findCommune } = require('../src/utils/communeLookup');

const BATCH_SIZE = 200;

async function main() {
  const { rows } = await db.query(
    `SELECT id, latitude, longitude FROM dabs WHERE country_code = 'DZ'`
  );

  console.log(`[Backfill] ${rows.length} DAB algériens à traiter...`);

  let updated = 0;
  let unresolved = 0;
  const start = Date.now();

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (row) => {
      const commune = findCommune(parseFloat(row.longitude), parseFloat(row.latitude));
      if (!commune) { unresolved++; return; }
      await db.query('UPDATE dabs SET commune = $1 WHERE id = $2', [commune, row.id]);
      updated++;
    }));
    process.stdout.write(`\r[Backfill] ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log(`\n[Backfill] Terminé en ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`  ✅ Mis à jour : ${updated}`);
  console.log(`  ⚠️  Non résolus : ${unresolved}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Backfill] Erreur fatale :', err.message);
  process.exit(1);
});
