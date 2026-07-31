const router = require('express').Router();
const {
  getDabs, listTokens, createToken, toggleToken, extendToken,
} = require('../controllers/embedController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');

// Route publique — appelée par la page embed frontend
router.get('/:token/dabs', getDabs);

// Routes admin — gestion tokens
router.get('/admin/tokens',             authMiddleware, requireAdmin, listTokens);
router.post('/admin/tokens',            authMiddleware, requireAdmin, createToken);
router.patch('/admin/tokens/:id',       authMiddleware, requireAdmin, toggleToken);
router.post('/admin/tokens/:id/extend', authMiddleware, requireAdmin, extendToken);

module.exports = router;
