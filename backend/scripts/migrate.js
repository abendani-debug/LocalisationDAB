/**
 * Applique les migrations SQL de backend/migrations/ non encore jouées,
 * dans l'ordre alphabétique, et trace ce qui a été appliqué dans la table
 * schema_migrations. Idempotent : relancer ce script ne fait rien si tout
 * est déjà à jour.
 * Usage : node scripts/migrate.js  (depuis le dossier backend/)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

const ensureTrackingTable = () =>
  db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

const getAppliedMigrations = async () => {
  const { rows } = await db.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
};

async function migrate() {
  await ensureTrackingTable();
  const applied = await getAppliedMigrations();

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('[migrate] Base à jour — aucune migration en attente.');
    return;
  }

  console.log(`[migrate] ${pending.length} migration(s) à appliquer : ${pending.join(', ')}`);

  for (const filename of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
    console.log(`[migrate] Exécution de ${filename}...`);
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`[migrate] OK — ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] ECHEC — ${filename} :`, err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('[migrate] Terminé.');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] Erreur fatale :', err.message);
    process.exit(1);
  });
