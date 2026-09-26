require('express-async-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { env } = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseUtils');

const register = async (req, res) => {
  const { nom, email, password } = req.body;

  const existing = await User.findByEmail(email);
  if (existing.rows.length > 0) {
    return errorResponse(res, 'Inscription impossible. Vérifiez vos informations.', 400);
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const result = await User.create(nom, email, passwordHash);

  return successResponse(res, result.rows[0], 201, 'Compte créé avec succès.');
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await User.findByEmail(email);
  const user = result.rows[0];

  const valid = user && await bcrypt.compare(password, user.password_hash);
  if (!valid || !user.is_active) {
    return errorResponse(res, 'Identifiants invalides.', 401);
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return successResponse(res, {
    token,
    user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
  }, 200, 'Connexion réussie.');
};

const me = async (req, res) => {
  return successResponse(res, req.user);
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await User.findByEmail(req.user.email);
  const user = result.rows[0];

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return errorResponse(res, 'Mot de passe actuel incorrect.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await User.updatePassword(req.user.id, newHash);

  return successResponse(res, null, 200, 'Mot de passe mis à jour.');
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const result = await User.findByEmail(email);
  const user = result.rows[0];

  if (user && user.is_active) {
    await PasswordResetToken.invalidateAllForUser(user.id);
    const token = await PasswordResetToken.create(user.id);
    sendPasswordResetEmail(user.email, token).catch((err) =>
      console.error('Erreur envoi email de réinitialisation :', err.message)
    );
  }

  return successResponse(res, null, 200, 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.');
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

module.exports = { register, login, me, updatePassword, forgotPassword, resetPassword };
