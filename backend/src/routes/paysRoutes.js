// backend/src/routes/paysRoutes.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { successResponse } = require('../utils/responseUtils');

// GET /api/pays — liste des pays actifs (publique)
// Retourne les bbox pour la géodétection côté frontend.
router.get('/', async (req, res) => {
  const result = await db.query(`
    SELECT
      code_iso,
      nom,
      center_lat,
      center_lng,
      bbox_min_lat,
      bbox_max_lat,
      bbox_min_lng,
      bbox_max_lng,
      default_zoom
    FROM pays
    WHERE is_active = true
    ORDER BY nom
  `);
  return successResponse(res, result.rows);
});

module.exports = router;
