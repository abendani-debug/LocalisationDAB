const { query } = require('express-validator');

const periodValidator = [
  query('period')
    .optional()
    .isIn(['7', '30', '90', 'all']).withMessage('period doit être 7, 30, 90 ou all.'),
];

module.exports = { periodValidator };
