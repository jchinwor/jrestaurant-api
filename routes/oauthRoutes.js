const express = require('express');
const router = express.Router();
const passport = require('../config/passport'); // initializes strategies
const { issueTokenAndRedirect } = require('../controllers/oauthController');

// Kick off Google OAuth (optionally pass "state" to preserve a returnTo)
router.get(
  '/google',
  (req, res, next) => {
    // Preserve where to return (optional)
    // e.g. /auth/google?state=/cart
    req.session = req.session || {};
    req.session.oauthState = req.query.state || '';
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  (req, res, next) => {
    // if you want to use state from session → append it to FRONTEND_REDIRECT_URL
    // e.g. FRONTEND_REDIRECT_URL?token=...&state=/cart
    const state = (req.session && req.session.oauthState) ? `&state=${encodeURIComponent(req.session.oauthState)}` : '';
    req.stateSuffix = state;
    next();
  },
  (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    const base = process.env.FRONTEND_REDIRECT_URL;
    return res.redirect(`${base}?token=${token}${req.stateSuffix || ''}`);
  }
);

router.get('/google/failure', (req, res) => {
  res.status(401).json({ status: 'fail', message: 'Google authentication failed' });
});

module.exports = router;
