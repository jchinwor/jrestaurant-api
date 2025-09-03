const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/userModel'); // adjust path

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
} = process.env;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Google profile fields you’ll use
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        const name = profile.displayName || (profile.name?.givenName + ' ' + profile.name?.familyName);
        const avatar = profile.photos && profile.photos[0] && profile.photos[0].value;

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name,
            email,
            password: undefined,          // no password (social login)
            provider: 'google',
            googleId: profile.id,
            avatar
          });
        } else {
          // Optionally link provider if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = user.provider || 'google';
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

module.exports = passport;
