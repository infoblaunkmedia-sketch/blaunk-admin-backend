const express = require('express');
const {
  loginController,
  meController,
  updateProfileController,
  forgotPasswordController,
  resetPasswordController,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginController);
/** Same credentials as `/login`; not subject to IP whitelist (see checkIPWhitelist). */
router.post('/admin/login', loginController);
router.get('/me', authMiddleware, meController);
router.patch('/profile', authMiddleware, updateProfileController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

module.exports = router;

