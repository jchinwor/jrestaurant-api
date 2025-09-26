const express = require('express');
const router = express.Router();
const passport = require('../config/passport'); // initializes strategies
const { issueTokenAndRedirect } = require('../controllers/oauthController');

// Kick off Google OAuth (optionally pass "state" to preserve a returnTo)
router.get(
  '/google',
  (req, res, next) => {
    req.session = req.session || {};
    req.session.oauthState = req.query.state || '';
    req.session.isAdminLogin = req.query.admin === 'true'; // 👈 save admin intent
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  (req, res, next) => {
    const state = (req.session && req.session.oauthState) ? `&state=${encodeURIComponent(req.session.oauthState)}` : '';
    req.stateSuffix = state;
    req.isAdminLogin = req.session?.isAdminLogin; // 👈 carry flag forward
    next();
  },
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // ✅ Redirect logic based on admin flag
    let base;
    if (req.isAdminLogin) {
      if (req.user.role !== 'admin') {
        return res.redirect(`${process.env.ADMIN_REDIRECT_URL}?error=not_authorized`);
      }
      base = process.env.ADMIN_REDIRECT_URL;
    } else {
      base = process.env.USER_REDIRECT_URL;
    }

    return res.redirect(`${base}?token=${token}${req.stateSuffix || ''}`);
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ status: 'fail', message: 'Google authentication failed' });
});

module.exports = router;
