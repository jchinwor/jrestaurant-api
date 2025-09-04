const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // adjust path

exports.issueTokenAndRedirect = async (req, res) => {
  try {
    // Passport put Google profile on req.user
    const googleProfile = req.user;
    if (!googleProfile) {
      return res.redirect(`${process.env.FRONTEND_REDIRECT_URL}?error=auth_failed`);
    }

    // Try to find user by email
    let user = await User.findOne({ email: googleProfile.emails[0].value });

    // If not found, create one
    if (!user) {
      user = await User.create({
        name: googleProfile.displayName,
        email: googleProfile.emails[0].value,
        password: null,           // no password for Google login
        provider: 'google',       // optional field
        googleId: googleProfile.id
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect back to frontend with token
    const frontendTarget = `${process.env.FRONTEND_REDIRECT_URL}?token=${token}`;
    return res.redirect(frontendTarget);

  } catch (err) {
    console.error('OAuth error:', err);
    return res.redirect(`${process.env.FRONTEND_REDIRECT_URL}?error=server_error`);
  }
};
