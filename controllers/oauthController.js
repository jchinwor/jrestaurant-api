const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // adjust path

exports.issueTokenAndRedirect = async (req, res) => {
  try {
    const googleProfile = req.user;
    if (!googleProfile) {
      return res.redirect(`${process.env.USER_APP_URL}?error=auth_failed`);
    }

    let user = await User.findOne({ email: googleProfile.emails[0].value });

 if (!user) {
  user = await User.create({
    name: googleProfile.displayName,
    email: googleProfile.emails[0].value,
    password: null,
    provider: 'google',
    googleId: googleProfile.id,
    role: 'user', // default role
    avatar: googleProfile.photos?.[0]?.value || null
  });
}
    // Sign JWT
    const token = jwt.sign(
      {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    avatar: user.avatar || user.googleAvatar || "" // store google profile picture if available
  },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Decide redirect target based on role + where login was initiated
    const isAdminLogin = req.query.admin === "true"; // 👈 frontend passes ?admin=true when calling
    if (isAdminLogin) {
      if (user.role !== "admin") {
        return res.redirect(`${process.env.ADMIN_APP_URL}?error=not_authorized`);
      }
      return res.redirect(`${process.env.ADMIN_APP_URL}?token=${token}`);
    }

    // Default → normal user login
    return res.redirect(`${process.env.USER_APP_URL}?token=${token}`);

  } catch (err) {
    console.error("OAuth error:", err);
    return res.redirect(`${process.env.USER_APP_URL}?error=server_error`);
  }
};

