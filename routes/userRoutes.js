const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/signout',protect, authController.signout);

router.patch('/send-verification-code',protect, authController.sendVerificationCode);
router.patch('/verify-verification-code',protect, authController.verifyVerificationCode);
router.patch('/reset-password',protect, authController.resetPassword);

router.patch('/send-forgot-password', authController.forgotPassword);
router.patch('/verify-forgot-password-code', authController.verifyForgotPasswordCode);



router.get('/', protect, admin, authController.getAllUsers);
router.get('/:id', protect, authController.getUserById);
router.put('/:id', protect, authController.updateUser);
router.delete('/:id', protect, admin, authController.deleteUser);

module.exports = router;
