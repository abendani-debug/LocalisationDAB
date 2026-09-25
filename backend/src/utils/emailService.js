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
