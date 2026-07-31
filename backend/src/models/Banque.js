const db = require('../config/db');

const findAll = (countryCode = null) => {
  if (!countryCode) return db.query('SELECT * FROM banques ORDER BY nom ASC');
  return db.query(
    `SELECT DISTINCT b.* FROM banques b
     JOIN dabs d ON d.banque_id = b.id
     WHERE d.country_code = $1 AND d.is_verified = TRUE
     ORDER BY b.nom ASC`,
    [countryCode]
  );
};

const findById = (id) =>
  db.query('SELECT * FROM banques WHERE id = $1', [id]);

module.exports = { findAll, findById };
