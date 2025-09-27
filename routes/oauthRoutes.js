const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");

// Start Google OAuth → use state to track admin/user intent
router.get("/google", (req, res, next) => {
  const isAdmin = req.query.admin === "true";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: isAdmin ? "admin" : "user", // 👈 round-trip flag
  })(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
      );

      // ✅ read flag from query.state (passed through Google)
      const isAdminLogin = req.query.state === "admin";

      let base;
      if (isAdminLogin) {
        if (req.user.role !== "admin") {
          return res.redirect(
            `${process.env.ADMIN_APP_URL}?error=not_authorized`
          );
        }
        base = process.env.ADMIN_APP_URL;
      } else {
        base = process.env.USER_APP_URL;
      }

      return res.redirect(`${base}?token=${token}`);
    } catch (err) {
      console.error("OAuth error:", err);
      return res.redirect(
        `${process.env.USER_APP_URL}?error=server_error`
      );
    }
  }
);

// Failure handler
router.get("/google/failure", (req, res) => {
  res
    .status(401)
    .json({ status: "fail", message: "Google authentication failed" });
});

module.exports = router;
