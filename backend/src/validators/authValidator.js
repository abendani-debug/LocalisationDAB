const { body } = require('express-validator');

const registerValidator = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis.')
    .isLength({ max: 100 }).withMessage('Nom trop long (max 100 caractères).'),
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères.')
    .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre.'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis.'),
];

const passwordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Le mot de passe actuel est requis.'),
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis.')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères.')
    .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre.'),
];

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

module.exports = { registerValidator, loginValidator, passwordValidator, forgotPasswordValidator, resetPasswordValidator };
