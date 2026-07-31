// backend/src/routes/adminPaysRoutes.js
const express        = require('express');
const router         = express.Router();
const db             = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { successResponse, errorResponse } = require('../utils/responseUtils');

// GET /api/admin/pays — liste tous les pays avec stats
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  const result = await db.query(`
    SELECT
      p.code_iso,
      p.nom,
      p.center_lat,
      p.center_lng,
      p.default_zoom,
      p.is_active,
      p.created_at,
      COUNT(d.id)::int      AS nb_dabs,
      MAX(d.updated_at)     AS dernier_import
    FROM pays p
    LEFT JOIN dabs d ON d.country_code = p.code_iso
    GROUP BY p.id
    ORDER BY p.nom
  `);
  return successResponse(res, result.rows);
});

// PATCH /api/admin/pays/:code_iso/toggle — activer/désactiver un pays
router.patch('/:code_iso/toggle', authMiddleware, requireAdmin, async (req, res) => {
  const code = req.params.code_iso.toUpperCase();
  const result = await db.query(
    `UPDATE pays
     SET is_active = NOT is_active
     WHERE code_iso = $1
     RETURNING code_iso, nom, is_active`,
    [code]
  );
  if (!result.rows[0]) return errorResponse(res, 'Pays non trouvé', 404);
  return successResponse(res, result.rows[0]);
});

// POST /api/admin/pays/:code_iso/import — déclencher import pour un pays
router.post('/:code_iso/import', authMiddleware, requireAdmin, async (req, res) => {
  const code = req.params.code_iso.toUpperCase();

  const importFns = {
    DZ: () => require('../utils/osmImport').syncGooglePlaces(),
    FR: () => require('../utils/frImport').syncFrancePlaces(),
  };

  const fn = importFns[code];
  if (!fn) return errorResponse(res, `Import non disponible pour le pays "${code}"`, 400);

  const result = await fn();
  return successResponse(res, result, 200, `Import ${code} terminé.`);
});

module.exports = router;
