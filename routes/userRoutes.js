const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/signout',protect, authController.signout);


router.patch('/reset-password', authController.resetPassword);

router.patch('/send-forgot-password', authController.forgotPassword);
router.post('/contact-email', authController.contactMessage);



router.get('/me', protect, authController.getMe);
router.get('/', protect, admin, authController.getAllUsers);
router.get('/:id', protect, authController.getUserById);
router.put('/:id', protect, authController.updateUser);
router.delete('/:id', protect, admin, authController.deleteUser);

// router.get('/me', protect, async (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: req.user
//   });
// });

module.exports = router;
