import express from "express";
import { signup, login,  forgetPassword, Resetpassword } from "../controllers/usercontroller.js"
import  protect   from "../middleware/authmiddleware.js"
import jwt from "jsonwebtoken"
import passport from 'passport';
import { registerEmployee } from "../controllers/admin.js"
const router = express.Router();

router.post("/signup", signup);
router.post("/login" ,login);
router.post("/forgetPassword", forgetPassword);
router.post("/Resetpassword/:token",Resetpassword);
router.post("/employee/register/:token", registerEmployee);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 3. Google Auth Trigger
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Forces account selection screen for easier testing
}));

// 4. Google Callback Route
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login' }), 
  (req, res) => {
    // Generate the token
    const token = generateToken(req.user._id);

    // Prepare user data to send to frontend so the Login.jsx useEffect can catch it
    const userData = encodeURIComponent(JSON.stringify({
 _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user',
      avatar: req.user.avatar
  }));
    // Redirect with both Token and User Data
    res.redirect(`http://localhost:5173/login?token=${token}&user=${userData}`);
  }
);
export default router;
