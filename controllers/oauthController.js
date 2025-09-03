const jwt = require('jsonwebtoken');

exports.issueTokenAndRedirect = (req, res) => {
  // Passport put user on req.user
  const user = req.user;
  if (!user) {
    return res.redirect(`${process.env.FRONTEND_REDIRECT_URL}?error=auth_failed`);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const frontendTarget = `${process.env.FRONTEND_REDIRECT_URL}?token=${token}`;
  return res.redirect(frontendTarget);
};
