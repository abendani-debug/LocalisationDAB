# Réinitialisation de mot de passe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à tout utilisateur de réinitialiser son mot de passe en libre-service via un lien envoyé par email (Resend), suite à l'audit de sécurité du 2026-09-25 qui a révélé qu'aucun mécanisme de ce type n'existait.

**Architecture:** Token aléatoire (32 octets), haché en SHA-256 avant stockage en base (table `password_reset_tokens`), usage unique, expire après 1h. Deux routes publiques (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`) avec réponses génériques anti-énumération. Envoi d'email via le SDK `resend`, isolé dans `backend/src/utils/emailService.js`.

**Tech Stack:** Node.js/Express, PostgreSQL, React, react-hook-form + zod, Resend (SDK `resend`)

**Spec de référence :** `docs/superpowers/specs/2026-09-25-password-reset-design.md`

---

## Fichiers créés / modifiés

### Backend
| Fichier | Action | Rôle |
|---|---|---|
| `backend/migrations/010_password_reset_tokens.sql` | Créer | Table `password_reset_tokens` |
| `backend/src/config/env.js` | Modifier | `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` (optionnels, pas de crash si absents) |
| `backend/src/models/PasswordResetToken.js` | Créer | CRUD tokens (création, recherche, invalidation) |
| `backend/src/utils/emailService.js` | Créer | Envoi de l'email via Resend, isolé du reste du code |
| `backend/src/validators/authValidator.js` | Modifier | `forgotPasswordValidator`, `resetPasswordValidator` |
| `backend/src/middlewares/rateLimiter.js` | Modifier | `passwordResetLimiter` (3/h/IP) |
| `backend/src/controllers/authController.js` | Modifier | `forgotPassword`, `resetPassword` |
| `backend/src/routes/authRoutes.js` | Modifier | Routes `/forgot-password`, `/reset-password` |
| `backend/tests/passwordReset.test.js` | Créer | Tests des deux routes |

### Frontend
| Fichier | Action | Rôle |
|---|---|---|
| `frontend/src/api/authApi.js` | Modifier | `forgotPassword()`, `resetPassword()` |
| `frontend/src/components/Auth/ForgotPasswordForm.jsx` | Créer | Formulaire demande de reset |
| `frontend/src/components/Auth/ResetPasswordForm.jsx` | Créer | Formulaire nouveau mot de passe |
| `frontend/src/pages/ForgotPasswordPage.jsx` | Créer | Page conteneur |
| `frontend/src/pages/ResetPasswordPage.jsx` | Créer | Page conteneur |
| `frontend/src/components/Auth/LoginForm.jsx` | Modifier | Lien "Mot de passe oublié ?" |
| `frontend/src/App.jsx` | Modifier | Routes `/mot-de-passe-oublie`, `/reset-password` |
| `frontend/src/i18n/locales/fr.json` | Modifier | Clés `auth.forgot_password_*`, `auth.reset_password_*` |
| `frontend/src/i18n/locales/en.json` | Modifier | Idem en anglais |

---

## Task 1 — Migration BDD : table `password_reset_tokens`

**Files:**
- Create: `backend/migrations/010_password_reset_tokens.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- 010_password_reset_tokens.sql
-- Tokens de réinitialisation de mot de passe. Le token brut n'est jamais
-- stocké — seul son hash SHA-256 l'est (cohérent avec le hachage des IP
-- ailleurs dans ce projet, cf. IP_SALT).

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens (token_hash);
```

- [ ] **Step 2 : Appliquer la migration en local**

```bash
cd backend
node scripts/migrate.js
```

Résultat attendu : `[migrate] OK — 010_password_reset_tokens.sql`

- [ ] **Step 3 : Vérifier la table**

```bash
psql $DATABASE_URL -c "\d password_reset_tokens"
```

Résultat attendu : colonnes `id, user_id, token_hash, expires_at, used_at, created_at`

- [ ] **Step 4 : Commit**

```bash
git add backend/migrations/010_password_reset_tokens.sql
git commit -m "feat(db): migration 010 — table password_reset_tokens"
```

---

## Task 2 — Config env : RESEND_API_KEY, EMAIL_FROM, APP_URL

**Files:**
- Modify: `backend/src/config/env.js`

Ces variables sont **optionnelles** (pas de `required()`) : si elles manquent, l'app démarre normalement, seul l'envoi d'email échouera proprement (géré au Task 4). Ne jamais faire planter tout le serveur pour une fonctionnalité annexe.

- [ ] **Step 1 : Lire le fichier actuel**

Ouvrir `backend/src/config/env.js` et repérer la fin de l'objet `env` (juste avant la ligne `GOOGLE_PLACES_API_KEY:   required('GOOGLE_PLACES_API_KEY'),`).

- [ ] **Step 2 : Ajouter les nouvelles clés**

Ajouter juste après la ligne `GOOGLE_PLACES_API_KEY:   required('GOOGLE_PLACES_API_KEY'),` :

```js
  RESEND_API_KEY:          process.env.RESEND_API_KEY || null,
  EMAIL_FROM:              process.env.EMAIL_FROM || 'noreply@mapsdab.com',
  APP_URL:                 process.env.APP_URL || 'http://localhost:5173',
```

- [ ] **Step 3 : Vérifier la syntaxe**

```bash
cd backend
node -e "require('./src/config/env'); console.log('OK')"
```

Résultat attendu : `OK` (le serveur ne doit pas planter même sans `RESEND_API_KEY` dans `.env`)

- [ ] **Step 4 : Ajouter les variables à `.env.example`**

Ouvrir `backend/.env.example`, ajouter à la fin :

```
RESEND_API_KEY=                # Clé API Resend (resend.com) — laisser vide en dev, l'envoi d'email sera juste désactivé
EMAIL_FROM=noreply@mapsdab.com
APP_URL=http://localhost:5173  # Utilisé pour construire le lien de réinitialisation dans l'email
```

- [ ] **Step 5 : Commit**

```bash
git add backend/src/config/env.js backend/.env.example
git commit -m "feat(backend): config env pour l'envoi d'email (Resend)"
```

---

## Task 3 — Modèle `PasswordResetToken.js`

**Files:**
- Create: `backend/src/models/PasswordResetToken.js`

- [ ] **Step 1 : Créer le modèle**

```js
// backend/src/models/PasswordResetToken.js
const crypto = require('crypto');
const db = require('../config/db');

const ONE_HOUR_MS = 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Invalide tous les tokens encore valides d'un utilisateur (appelé avant
 * d'en créer un nouveau, pour qu'un seul lien de reset soit actif à la fois).
 */
const invalidateAllForUser = (userId) =>
  db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [userId]
  );

/**
 * Crée un nouveau token pour un utilisateur. Retourne le token EN CLAIR
 * (à envoyer par email) — seul son hash est stocké en base.
 */
const create = async (userId, ttlMs = ONE_HOUR_MS) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
};

/**
 * Cherche un token valide (non utilisé, non expiré) à partir du token en
 * clair reçu du client.
 */
const findValidByToken = (token) =>
  db.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [hashToken(token)]
  );

const markUsed = (id) =>
  db.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [id]);

module.exports = { create, invalidateAllForUser, findValidByToken, markUsed, hashToken };
```

- [ ] **Step 2 : Vérifier la syntaxe**

```bash
node -e "require('./backend/src/models/PasswordResetToken')" && echo "OK"
```

Résultat attendu : `OK`

- [ ] **Step 3 : Commit**

```bash
git add backend/src/models/PasswordResetToken.js
git commit -m "feat(backend): modèle PasswordResetToken"
```

---

## Task 4 — `emailService.js` (envoi via Resend)

**Files:**
- Create: `backend/src/utils/emailService.js`

- [ ] **Step 1 : Installer le SDK Resend**

```bash
cd backend
npm install resend
```

- [ ] **Step 2 : Vérifier l'absence de conflit de peer dependencies**

```bash
npm install
```

Résultat attendu : aucune erreur `ERESOLVE` (le SDK Resend n'a pas de peer dependency sur les libs du projet, mais on vérifie systématiquement après tout ajout de dépendance — cf. incident `react-leaflet-cluster` du 2026-09-23).

- [ ] **Step 3 : Créer le service**

```js
// backend/src/utils/emailService.js
const { Resend } = require('resend');
const { env } = require('../config/env');

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * Lève une erreur si RESEND_API_KEY n'est pas configurée — à catcher côté
 * appelant (le contrôleur ne doit jamais révéler un échec d'envoi au client).
 */
const sendPasswordResetEmail = async (email, token) => {
  if (!resend) {
    throw new Error('RESEND_API_KEY non configurée — email non envoyé.');
  }

  const link = `${env.APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — MapsDab',
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe MapsDab.</p>
      <p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    `,
  });
};

module.exports = { sendPasswordResetEmail };
```

- [ ] **Step 4 : Vérifier la syntaxe**

```bash
node -e "require('./backend/src/utils/emailService')" && echo "OK"
```

Résultat attendu : `OK`

- [ ] **Step 5 : Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/utils/emailService.js
git commit -m "feat(backend): service d'envoi d'email de reset via Resend"
```

---

## Task 5 — Validators

**Files:**
- Modify: `backend/src/validators/authValidator.js`

- [ ] **Step 1 : Ajouter les deux nouveaux validators**

Ajouter avant `module.exports` dans `backend/src/validators/authValidator.js` :

```js
const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty().withMessage('Token requis.'),
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères.')
    .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre.'),
];
```

- [ ] **Step 2 : Mettre à jour `module.exports`**

Remplacer :
```js
module.exports = { registerValidator, loginValidator, passwordValidator };
```
Par :
```js
module.exports = { registerValidator, loginValidator, passwordValidator, forgotPasswordValidator, resetPasswordValidator };
```

- [ ] **Step 3 : Vérifier la syntaxe**

```bash
node -e "require('./backend/src/validators/authValidator')" && echo "OK"
```

- [ ] **Step 4 : Commit**

```bash
git add backend/src/validators/authValidator.js
git commit -m "feat(backend): validators forgot-password / reset-password"
```

---

## Task 6 — Rate limiter dédié

**Files:**
- Modify: `backend/src/middlewares/rateLimiter.js`

- [ ] **Step 1 : Ajouter `passwordResetLimiter`**

Ajouter dans `backend/src/middlewares/rateLimiter.js`, après `propositionLimiter` :

```js
// Demande de réinitialisation de mot de passe : max 3 par heure par IP
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
```

- [ ] **Step 2 : L'exporter**

Remplacer la ligne `module.exports` par :
```js
module.exports = { globalLimiter, authLimiter, signalLimiter, adminBypassSignalLimiter, propositionLimiter, dabsReadLimiter, passwordResetLimiter };
```

- [ ] **Step 3 : Vérifier la syntaxe**

```bash
node -e "require('./backend/src/middlewares/rateLimiter')" && echo "OK"
```

- [ ] **Step 4 : Commit**

```bash
git add backend/src/middlewares/rateLimiter.js
git commit -m "feat(backend): rate limiter dédié pour forgot-password"
```

---

## Task 7 — Écrire les tests (TDD) avant le contrôleur

**Files:**
- Create: `backend/tests/passwordReset.test.js`

- [ ] **Step 1 : Écrire le fichier de test complet**

```js
// backend/tests/passwordReset.test.js
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
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd backend
npx jest tests/passwordReset.test.js
```

Résultat attendu : échecs avec des erreurs du type `Cannot find module '../src/models/PasswordResetToken'` n'existant pas encore côté routes, ou 404 sur les routes — normal, le contrôleur et les routes n'existent pas encore (Task 8-9).

- [ ] **Step 3 : Commit**

```bash
git add backend/tests/passwordReset.test.js
git commit -m "test(backend): tests forgot-password / reset-password (TDD, échouent pour l'instant)"
```

---

## Task 8 — Contrôleur `authController.js`

**Files:**
- Modify: `backend/src/controllers/authController.js`

- [ ] **Step 1 : Ajouter les imports en haut du fichier**

Remplacer :
```js
require('express-async-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseUtils');
```
Par :
```js
require('express-async-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { env } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseUtils');
```

- [ ] **Step 2 : Ajouter les deux fonctions**

Ajouter avant `module.exports` :

```js
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await User.findByEmail(email);
  const user = result.rows[0];

  if (user && user.is_active) {
    await PasswordResetToken.invalidateAllForUser(user.id);
    const token = await PasswordResetToken.create(user.id);
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error('Erreur envoi email de réinitialisation :', err.message);
    }
  }

  return successResponse(
    res, null, 200,
    'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
  );
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const result = await PasswordResetToken.findValidByToken(token);
  const resetRow = result.rows[0];

  if (!resetRow) {
    return errorResponse(res, 'Lien invalide ou expiré.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await User.updatePassword(resetRow.user_id, newHash);
  await PasswordResetToken.markUsed(resetRow.id);

  return successResponse(res, null, 200, 'Mot de passe réinitialisé avec succès.');
};
```

- [ ] **Step 3 : Mettre à jour `module.exports`**

Remplacer :
```js
module.exports = { register, login, me, updatePassword };
```
Par :
```js
module.exports = { register, login, me, updatePassword, forgotPassword, resetPassword };
```

- [ ] **Step 4 : Vérifier la syntaxe**

```bash
node -e "require('./backend/src/controllers/authController')" && echo "OK"
```

- [ ] **Step 5 : Commit**

```bash
git add backend/src/controllers/authController.js
git commit -m "feat(backend): contrôleur forgot-password / reset-password"
```

---

## Task 9 — Routes

**Files:**
- Modify: `backend/src/routes/authRoutes.js`

- [ ] **Step 1 : Remplacer le contenu complet du fichier**

```js
const router = require('express').Router();
const { register, login, me, updatePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validateMiddleware');
const {
  registerValidator, loginValidator, passwordValidator,
  forgotPasswordValidator, resetPasswordValidator,
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, register);
router.post('/login',    authLimiter, loginValidator, validate, login);
router.get('/me',        authMiddleware, me);
router.put('/password',  authMiddleware, passwordValidator, validate, updatePassword);

router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password',  resetPasswordValidator, validate, resetPassword);

module.exports = router;
```

- [ ] **Step 2 : Lancer les tests — ils doivent maintenant passer**

```bash
cd backend
npx jest tests/passwordReset.test.js
```

Résultat attendu : `Tests: 7 passed, 7 total`

- [ ] **Step 3 : Lancer toute la suite pour vérifier l'absence de régression**

```bash
npx jest
```

Résultat attendu : tous les tests passent (102 + 7 nouveaux = 109)

- [ ] **Step 4 : Commit**

```bash
git add backend/src/routes/authRoutes.js
git commit -m "feat(backend): routes /forgot-password et /reset-password"
```

---

## Task 10 — Frontend : `authApi.js`

**Files:**
- Modify: `frontend/src/api/authApi.js`

- [ ] **Step 1 : Ajouter les deux fonctions**

Ajouter à la fin de `frontend/src/api/authApi.js` :

```js
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data);
```

- [ ] **Step 2 : Commit**

```bash
git add frontend/src/api/authApi.js
git commit -m "feat(frontend): API forgotPassword / resetPassword"
```

---

## Task 11 — i18n : clés fr + en

**Files:**
- Modify: `frontend/src/i18n/locales/fr.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1 : Ajouter les clés dans `fr.json`**

Dans le bloc `"auth": { ... }` de `frontend/src/i18n/locales/fr.json`, ajouter avant la fermeture `}` du bloc (après une virgule sur la dernière clé existante) :

```json
    "forgot_password_link": "Mot de passe oublié ?",
    "forgot_password_title": "Mot de passe oublié",
    "forgot_password_subtitle": "Indiquez votre email, nous vous enverrons un lien de réinitialisation.",
    "forgot_password_submit": "Envoyer le lien",
    "forgot_password_sending": "Envoi…",
    "forgot_password_sent": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez votre boîte de réception.",
    "back_to_login": "Retour à la connexion",
    "new_password": "Nouveau mot de passe",
    "confirm_password": "Confirmer le mot de passe",
    "passwords_must_match": "Les mots de passe ne correspondent pas.",
    "reset_password_submit": "Réinitialiser le mot de passe",
    "reset_password_submitting": "Réinitialisation…",
    "reset_password_success": "Mot de passe réinitialisé, vous pouvez vous connecter.",
    "reset_password_error": "Une erreur est survenue.",
    "reset_password_no_token": "Lien invalide. Refaites une demande de réinitialisation."
```

- [ ] **Step 2 : Ajouter les clés équivalentes dans `en.json`**

Même emplacement dans `frontend/src/i18n/locales/en.json` :

```json
    "forgot_password_link": "Forgot password?",
    "forgot_password_title": "Forgot password",
    "forgot_password_subtitle": "Enter your email and we'll send you a reset link.",
    "forgot_password_submit": "Send reset link",
    "forgot_password_sending": "Sending…",
    "forgot_password_sent": "If an account exists with this email, a reset link has been sent. Check your inbox.",
    "back_to_login": "Back to login",
    "new_password": "New password",
    "confirm_password": "Confirm password",
    "passwords_must_match": "Passwords do not match.",
    "reset_password_submit": "Reset password",
    "reset_password_submitting": "Resetting…",
    "reset_password_success": "Password reset, you can now log in.",
    "reset_password_error": "Something went wrong.",
    "reset_password_no_token": "Invalid link. Please request a new reset link."
```

- [ ] **Step 3 : Vérifier la syntaxe JSON des deux fichiers**

```bash
cd frontend
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/fr.json','utf8')); console.log('fr.json OK')"
node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json','utf8')); console.log('en.json OK')"
```

Résultat attendu : `fr.json OK` et `en.json OK`

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/i18n/locales/fr.json frontend/src/i18n/locales/en.json
git commit -m "feat(i18n): clés forgot-password / reset-password fr + en"
```

---

## Task 12 — `ForgotPasswordForm.jsx` + `ForgotPasswordPage.jsx`

**Files:**
- Create: `frontend/src/components/Auth/ForgotPasswordForm.jsx`
- Create: `frontend/src/pages/ForgotPasswordPage.jsx`

- [ ] **Step 1 : Créer le formulaire**

```jsx
// frontend/src/components/Auth/ForgotPasswordForm.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword } from '../../api/authApi';

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const schema = z.object({
    email: z.string().email(t('auth.email_invalid')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
    } finally {
      // Réponse toujours générique côté backend : on affiche le même
      // message de succès que la demande ait abouti ou non.
      setSent(true);
    }
  };

  if (sent) {
    return <p className="text-sm text-slate-600 text-center">{t('auth.forgot_password_sent')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting ? t('auth.forgot_password_sending') : t('auth.forgot_password_submit')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2 : Créer la page**

```jsx
// frontend/src/pages/ForgotPasswordPage.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[400px] p-8 shadow-sm border border-slate-100">
        <h1 className="m-0 mb-2 text-2xl font-bold text-gray-900 text-center">{t('auth.forgot_password_title')}</h1>
        <p className="text-sm text-slate-500 text-center mb-6">{t('auth.forgot_password_subtitle')}</p>
        <ForgotPasswordForm />
        <p className="text-center mt-4 text-sm text-slate-500">
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">{t('auth.back_to_login')}</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/components/Auth/ForgotPasswordForm.jsx frontend/src/pages/ForgotPasswordPage.jsx
git commit -m "feat(frontend): page + formulaire mot de passe oublié"
```

---

## Task 13 — `ResetPasswordForm.jsx` + `ResetPasswordPage.jsx`

**Files:**
- Create: `frontend/src/components/Auth/ResetPasswordForm.jsx`
- Create: `frontend/src/pages/ResetPasswordPage.jsx`

- [ ] **Step 1 : Créer le formulaire**

```jsx
// frontend/src/components/Auth/ResetPasswordForm.jsx
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/authApi';
import toast from 'react-hot-toast';

export default function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const schema = z.object({
    newPassword: z.string()
      .min(8, t('auth.min_8_chars'))
      .regex(/[A-Z]/, t('auth.must_uppercase'))
      .regex(/[0-9]/, t('auth.must_digit')),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwords_must_match'),
    path: ['confirmPassword'],
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await resetPassword(token, data.newPassword);
      toast.success(t('auth.reset_password_success'));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.reset_password_error'));
    }
  };

  if (!token) {
    return <p className="text-sm text-red-600 text-center">{t('auth.reset_password_no_token')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{t('auth.new_password')}</label>
        <input
          type="password"
          {...register('newPassword')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{t('auth.confirm_password')}</label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting ? t('auth.reset_password_submitting') : t('auth.reset_password_submit')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2 : Créer la page**

```jsx
// frontend/src/pages/ResetPasswordPage.jsx
import { useTranslation } from 'react-i18next';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[400px] p-8 shadow-sm border border-slate-100">
        <h1 className="m-0 mb-6 text-2xl font-bold text-gray-900 text-center">{t('auth.reset_password_submit')}</h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add frontend/src/components/Auth/ResetPasswordForm.jsx frontend/src/pages/ResetPasswordPage.jsx
git commit -m "feat(frontend): page + formulaire réinitialisation de mot de passe"
```

---

## Task 14 — Lien "Mot de passe oublié ?" + routes App.jsx

**Files:**
- Modify: `frontend/src/components/Auth/LoginForm.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1 : Ajouter le lien dans `LoginForm.jsx`**

Dans `frontend/src/components/Auth/LoginForm.jsx`, remplacer le bloc du champ mot de passe :

```jsx
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          {...register('password')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
```

Par :

```jsx
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Mot de passe</label>
          <Link to="/mot-de-passe-oublie" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.forgot_password_link')}
          </Link>
        </div>
        <input
          type="password"
          {...register('password')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
```

Et ajouter l'import de `Link` en haut du fichier — remplacer :
```js
import { useTranslation } from 'react-i18next';
```
Par :
```js
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
```

- [ ] **Step 2 : Ajouter les imports et routes dans `App.jsx`**

Ajouter l'import après `import RegisterPage from './pages/RegisterPage';` :
```js
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
```

Ajouter les routes après `<Route path="/register" element={<RegisterPage />} />` :
```jsx
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"      element={<ResetPasswordPage />} />
```

- [ ] **Step 3 : Vérifier que le build passe**

```bash
cd frontend
npm run build
```

Résultat attendu : `✓ built in`

- [ ] **Step 4 : Commit**

```bash
git add frontend/src/components/Auth/LoginForm.jsx frontend/src/App.jsx
git commit -m "feat(frontend): lien mot de passe oublié + routes"
```

---

## Task 15 — Test manuel de bout en bout (local)

**Files:** Aucun fichier créé — vérification manuelle

- [ ] **Step 1 : Sans `RESEND_API_KEY` configurée (comportement par défaut) — vérifier que rien ne casse**

```bash
cd backend && npm run dev
```

Dans un autre terminal :
```bash
curl -s -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localisation-dab.dz"}'
```

Résultat attendu : `{"success":true,"message":"Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",...}` + dans les logs du serveur : `Erreur envoi email de réinitialisation : RESEND_API_KEY non configurée — email non envoyé.` (pas de crash)

- [ ] **Step 2 : Avec `RESEND_API_KEY` configurée (nécessite un compte Resend créé par l'utilisateur)**

Ajouter dans `backend/.env` : `RESEND_API_KEY=<clé fournie par l'utilisateur>`, `EMAIL_FROM=<adresse validée sur Resend>`. Relancer le serveur, refaire l'appel curl ci-dessus avec une vraie adresse email accessible, vérifier la réception de l'email et que le lien fonctionne de bout en bout (clic → `ResetPasswordPage` → nouveau mot de passe → connexion réussie avec le nouveau mot de passe).

- [ ] **Step 3 : Vérifier le comportement du frontend**

```bash
cd frontend && npm run dev
```

Ouvrir `http://localhost:5173/login`, cliquer "Mot de passe oublié ?", vérifier la redirection vers `/mot-de-passe-oublie`, soumettre un email, vérifier le message de confirmation générique.

- [ ] **Step 4 : Commit final**

```bash
git commit --allow-empty -m "test: réinitialisation de mot de passe validée de bout en bout en local"
```

---

## Notes de déploiement (à ne pas oublier)

- **Le VPS doit être passé sur Node ≥20 avant ce déploiement** — `resend@6.30.0` l'exige (`backend/package.json` `engines` a été corrigé en conséquence pendant la revue de la Task 4), mais le VPS tourne actuellement en Node 18.20.8 (confirmé le 2026-09-26 via `/proc/<pid>/exe`, alias nvm par défaut sur `18`). Node 20.20.2 est déjà installé via nvm sur le VPS — il suffit de changer l'alias par défaut (`nvm alias default 20`) et l'interpréteur utilisé par pm2 pour le process `localisation-dab`, puis de relancer. Sans ce changement, `npm install`/`npm ci` sur `deploy.sh` s'exécute avec un `engines` non satisfait, ce qui peut produire un `node_modules` cassé ou faire échouer le déploiement selon la configuration npm.
- **`RESEND_API_KEY` et `EMAIL_FROM` doivent être ajoutées au `.env` du VPS** avant que l'envoi d'email fonctionne en prod — sans ça, les routes fonctionnent mais aucun email ne part réellement (comportement dégradé propre, pas un crash, cf. Task 15 Step 1).
- **Le domaine `mapsdab.com` doit être vérifié côté Resend** (enregistrements DNS SPF/DKIM fournis par Resend, à ajouter par l'utilisateur) avant d'utiliser `EMAIL_FROM=noreply@mapsdab.com` en prod — sinon Resend refusera d'envoyer depuis ce domaine.
- **`APP_URL` doit valoir `https://mapsdab.com` en prod**, pas la valeur par défaut `http://localhost:5173` — à ajouter explicitement dans le `.env` du VPS.
- Déploiement standard ensuite : `git push origin develop` + `bash deploy.sh` sur le VPS (la migration 010 sera appliquée automatiquement par `node scripts/migrate.js`, déjà intégré à `deploy.sh`).
