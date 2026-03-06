import express from "express";
import { signup, login, forgetPassword, Resetpassword } from "../controllers/usercontroller.js";
import protect from "../middleware/authmiddleware.js";
import jwt from "jsonwebtoken";
import passport from 'passport';
import { registerEmployee } from "../controllers/admin.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.post("/Resetpassword/:token", Resetpassword);
router.post("/employee/register/:token", registerEmployee);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 3. Google Auth Trigger
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' 
}));

// 4. Google Callback Route
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false, 
    // FIX: Changed localhost to your real Vercel URL
    failureRedirect: 'https://online-complaints-nu.vercel.app/login' 
  }), 
  (req, res) => {
    const token = generateToken(req.user._id);

    const userData = encodeURIComponent(JSON.stringify({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user',
      avatar: req.user.avatar
    }));

    // FIX: Redirect to your LIVE VERCEL URL, not localhost
    res.redirect(`https://online-complaints-nu.vercel.app/login?token=${token}&user=${userData}`);
  }
);

export default router;