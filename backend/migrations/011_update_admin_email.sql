-- 011_update_admin_email.sql
-- Correction manuelle appliquée en prod le 2026-09-26 : l'email du compte
-- admin historique (admin@localisation-dab.dz) est remplacé par l'adresse
-- réelle du propriétaire du projet, pour pouvoir recevoir les emails de
-- réinitialisation de mot de passe (test de l'intégration Resend).
-- Idempotent : ne fait rien si déjà appliqué ou si l'ancien email n'existe
-- plus (déjà changé par un autre moyen).

UPDATE users
SET email = 'abendani@gmail.com'
WHERE email = 'admin@localisation-dab.dz'
  AND role = 'admin';
