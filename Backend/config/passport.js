import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../Models/User.js'; // Adjust path to your User model
import dotenv from 'dotenv';

dotenv.config();

// Inside your passport.js or wherever you defined the strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // IMPORTANT: If user exists, we DON'T overwrite their avatar 
          // if they've already uploaded a Cloudinary one.
          return done(null, user);
        }

        // 2. If it's a NEW user, save their Google Photo as the initial avatar
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0].value, // Initial Google Photo
          role: "user",
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Standard Passport serialization (required for session-less or session-based)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;