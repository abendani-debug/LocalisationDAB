require('express-async-errors');
const Banque = require('../models/Banque');
const { successResponse } = require('../utils/responseUtils');

const getAll = async (req, res) => {
  const { country_code } = req.query;
  const result = await Banque.findAll(country_code || null);
  return successResponse(res, result.rows);
};

module.exports = { getAll };
