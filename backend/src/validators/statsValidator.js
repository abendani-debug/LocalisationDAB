const { query } = require('express-validator');

const periodValidator = [
  query('period')
    .optional()
    .isIn(['7', '30', '90', 'all']).withMessage('period doit être 7, 30, 90 ou all.'),
];

const geographieValidator = [
  ...periodValidator,
  query('banque_id')
    .optional()
    .isInt().withMessage('banque_id doit être un entier.'),
];

module.exports = { periodValidator, geographieValidator };
