# Réinitialisation de mot de passe — Design Spec

## Contexte

Audit de sécurité du 2026-09-25 : le compte admin de production utilisait
encore le mot de passe par défaut du fichier de seed (exposé en clair sur
un dépôt GitHub public), jamais changé depuis le déploiement initial en
mai 2026. Rotation effectuée manuellement (script ponctuel non committé),
mais aucun mécanisme n'existe pour qu'un utilisateur (admin ou non)
change son mot de passe s'il l'a oublié ou veut le renouveler par
précaution — la seule voie actuelle est `PUT /api/auth/password`, qui
exige déjà de connaître le mot de passe courant.

## Objectif

Permettre à tout utilisateur (admin ou non) de réinitialiser son mot de
passe en libre-service via un lien envoyé par email, sans intervention
manuelle en base de données.

---

## Modèle de données

Nouvelle table `password_reset_tokens` :

```sql
CREATE TABLE password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens (token_hash);
```

- Le token brut (32 octets aléatoires, `crypto.randomBytes(32).toString('hex')`)
  n'est **jamais stocké** — seul son SHA-256 (`token_hash`) l'est, cohérent
  avec le hachage des IP déjà en place ailleurs dans le projet (`IP_SALT`).
- `expires_at` = `NOW() + 1 heure` à la création.
- `used_at` marqué au moment de la réinitialisation réussie — un token
  utilisé ne peut plus jamais resservir, même avant expiration.
- Pas de nettoyage automatique des lignes expirées dans cette v1 (volume
  négligeable) — un `DELETE WHERE expires_at < NOW() - INTERVAL '7 days'`
  ponctuel suffira si la table grossit, pas bloquant pour le lancement.

---

## Routes API

### `POST /api/auth/forgot-password`
```
body: { email }
```
- Toujours la même réponse (200, message générique), que l'email existe
  en base ou non — empêche l'énumération de comptes.
- Si l'email correspond à un compte actif :
  1. Invalide (marque `used_at = NOW()`) tout token de reset précédent
     encore valide pour cet utilisateur, pour n'avoir qu'un lien actif
     à la fois.
  2. Génère un nouveau token, l'enregistre haché avec expiration 1h.
  3. Envoie l'email via Resend avec le lien
     `https://mapsdab.com/reset-password?token=<token brut>`.
- Rate limité par IP : `passwordResetLimiter` (3 requêtes / heure),
  même famille que `authLimiter`/`signalLimiter` dans `rateLimiter.js`.
- Si l'envoi d'email échoue (Resend indisponible), logger l'erreur
  côté serveur mais renvoyer quand même la réponse générique au client
  (ne jamais révéler d'information technique interne).

### `POST /api/auth/reset-password`
```
body: { token, newPassword }
```
- Hache le `token` reçu, cherche une ligne `password_reset_tokens`
  correspondante avec `used_at IS NULL AND expires_at > NOW()`.
- Si aucune correspondance : 400, message générique
  ("Lien invalide ou expiré.").
- Si trouvée : valide `newPassword` avec les mêmes règles que
  `passwordValidator` existant (min 8, 1 majuscule, 1 chiffre), met à
  jour `users.password_hash`, marque le token `used_at = NOW()`.
- Pas de rate limiting spécifique nécessaire ici : le token lui-même
  (32 octets aléatoires) est la protection — un rate limit générique
  par IP peut s'appliquer via `globalLimiter` déjà en place.

---

## Envoi d'email — Resend

- Nouvelles variables d'environnement backend :
  ```
  RESEND_API_KEY=
  EMAIL_FROM=noreply@mapsdab.com
  ```
- Nouvelle dépendance : `resend` (SDK officiel Node).
- Domaine `mapsdab.com` à vérifier côté Resend (enregistrements DNS
  SPF/DKIM à ajouter par l'utilisateur — hors périmètre de
  l'implémentation, dépendance externe).
- Contenu de l'email : HTML simple, en français uniquement pour cette
  v1 (cohérent avec le reste des messages transactionnels de l'app qui
  ne sont pas encore tous traduits dynamiquement côté backend) :
  - Objet : "Réinitialisation de votre mot de passe — MapsDab"
  - Corps : lien de réinitialisation, mention "expire dans 1 heure",
    note "si vous n'êtes pas à l'origine de cette demande, ignorez cet
    email."
- Nouveau module `backend/src/utils/emailService.js` exposant
  `sendPasswordResetEmail(email, token)` — isole la dépendance Resend
  du reste du code (si le fournisseur change un jour, un seul fichier
  à toucher).

---

## Frontend

| Fichier | Action |
|---|---|
| `frontend/src/components/Auth/LoginForm.jsx` | Ajouter un lien "Mot de passe oublié ?" |
| `frontend/src/pages/ForgotPasswordPage.jsx` | Créer — formulaire email → message de confirmation générique |
| `frontend/src/pages/ResetPasswordPage.jsx` | Créer — lit `?token=` dans l'URL, formulaire nouveau mot de passe + confirmation |
| `frontend/src/api/authApi.js` | Ajouter `forgotPassword(email)` et `resetPassword(token, newPassword)` |
| `frontend/src/App.jsx` | Routes `/mot-de-passe-oublie` et `/reset-password` |
| `frontend/src/i18n/locales/{fr,en}.json` | Clés `auth.forgot_password_*` |

### Flux utilisateur
1. Page login → clic "Mot de passe oublié ?" → `ForgotPasswordPage`.
2. Saisie email → soumission → message "Si un compte existe avec cet
   email, un lien de réinitialisation a été envoyé." (toujours affiché,
   même si l'email n'existe pas).
3. Utilisateur clique le lien reçu par email → `ResetPasswordPage`
   (le token est lu depuis l'URL, jamais affiché ni modifiable).
4. Saisie nouveau mot de passe + confirmation → soumission → succès →
   toast + redirection vers `/login`.
5. En cas de token invalide/expiré : message clair invitant à refaire
   une demande, avec un lien retour vers `ForgotPasswordPage`.

---

## Sécurité — récapitulatif

- Aucune fuite d'information sur l'existence d'un compte (réponses
  génériques des deux côtés).
- Token à usage unique, haché en base (jamais en clair), expire après
  1 heure, invalide automatiquement tout token précédent à la demande
  suivante.
- Rate limiting dédié sur la demande de reset (3/h/IP) pour limiter le
  spam d'emails et les tentatives d'énumération par timing.
- Mêmes règles de robustesse de mot de passe qu'à l'inscription.
- `RESEND_API_KEY` dans `.env`, jamais committée (comme tous les autres
  secrets du projet).

## Hors scope (v1)
- Email bilingue (fr/en) — français uniquement pour l'instant.
- Nettoyage automatique (cron) des tokens expirés.
- Notification à l'utilisateur par email après un changement de mot de
  passe réussi (« votre mot de passe a été modifié » de sécurité).
- Réinitialisation forcée par un admin depuis le panneau d'administration
  (évoqué en discussion, écarté au profit du libre-service uniquement).
