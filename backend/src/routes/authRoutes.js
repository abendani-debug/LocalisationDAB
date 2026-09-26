const router = require('express').Router();
const { register, login, me, updatePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validateMiddleware');
const {
  registerValidator, loginValidator, passwordValidator,
  forgotPasswordValidator, resetPasswordValidator,
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, register);
router.post('/login',    authLimiter, loginValidator, validate, login);
router.get('/me',        authMiddleware, me);
router.put('/password',  authMiddleware, passwordValidator, validate, updatePassword);

router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password',  resetPasswordValidator, validate, resetPassword);

module.exports = router;
