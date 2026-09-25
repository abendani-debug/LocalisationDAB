/**
 * Crée (ou réinitialise) un compte admin avec un mot de passe aléatoire.
 * Le mot de passe n'est JAMAIS écrit dans un fichier — affiché une seule
 * fois dans le terminal, à noter immédiatement dans un gestionnaire de
 * mots de passe.
 *
 * Usage (depuis backend/) :
 *   node scripts/create-admin.js admin@exemple.com "Nom Admin"
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const generatePassword = (length = 24) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%^&*';
  const bytes = crypto.randomBytes(length);
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars[bytes[i] % chars.length];
  return pw;
};

async function main() {
  const email = process.argv[2];
  const nom = process.argv[3] || 'Admin';

  if (!email) {
    console.error('Usage : node scripts/create-admin.js <email> [nom]');
    process.exit(1);
  }

  const password = generatePassword();
  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

  const result = await db.query(
    `INSERT INTO users (nom, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'
     RETURNING id, email, role`,
    [nom, email, hash]
  );

  console.log('\n=== Compte admin prêt ===');
  console.log('Email     :', result.rows[0].email);
  console.log('Mot de passe (ne sera plus jamais affiché) :', password);
  console.log('==========================\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err.message); process.exit(1); });
