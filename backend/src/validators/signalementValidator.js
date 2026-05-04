const { body } = require('express-validator');

const signalementValidator = [
  body('etat')
    .notEmpty().withMessage('L\'état est requis.')
    .isIn(['disponible', 'vide', 'en_panne']).withMessage('État invalide. Valeurs : disponible, vide, en_panne.'),
  body('cookieId')
    .notEmpty().withMessage('Le cookieId est requis.')
    .isUUID().withMessage('cookieId doit être un UUID valide.'),
  body('userLat')
    .notEmpty().withMessage('La latitude utilisateur est requise.')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide (entre -90 et 90).'),
  body('userLng')
    .notEmpty().withMessage('La longitude utilisateur est requise.')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide (entre -180 et 180).'),
];

module.exports = { signalementValidator };
