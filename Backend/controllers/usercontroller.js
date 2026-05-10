import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js"
import nodemailer from 'nodemailer';
import sendEmail from "../utils/sendEmail.js";

// ================= SIGNUP (USERS ONLY) =================
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists)
    return res.status(400).json({ message: "User already exists" });

  // ✅ JUST PASS THE PLAIN PASSWORD. The Model's .pre("save") will hash it.
  await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: password, 
    role: "user",
  });

  res.status(201).json({ message: "Signup successful" });
};
// ================= LOGIN (USER + ADMIN + EMPLOYEE) =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Input Presence
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2. NORMALIZE: Trim spaces and convert to lowercase
    const cleanEmail = email.toLowerCase().trim();

    // 3. Find User
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.log(`DEBUG: No user found for [${cleanEmail}]`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4. Role & Activation Check
    const normalizedRole = user.role.toLowerCase();
    if (["employee", "manager"].includes(normalizedRole) && !user.isActive) {
      return res.status(403).json({
        message: "Please complete account setup using the email invitation.",
      });
    }

    // 5. Password Check (Ensure hashed password exists)
    if (!user.password) {
      return res.status(400).json({ message: "Account not set up. Check your email." });
    }

    // 6. BCRYPT COMPARE
    const match = await bcrypt.compare(password, user.password);
    console.log(`DEBUG: Password match for ${cleanEmail}: ${match}`);
    
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 7. JWT TOKEN (Verify Secret exists)
    if (!process.env.JWT_SECRET) {
      console.error("FATAL: JWT_SECRET is missing from .env file!");
      return res.status(500).json({ message: "Internal server configuration error" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 8. Avatar Logic
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const avatarUrl = user.avatar 
      ? (user.avatar.startsWith('http') ? user.avatar : `${baseUrl}${user.avatar}`) 
      : null;

    // 9. Success Response
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: avatarUrl,
        joined: user.createdAt,
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGET PASSWORD =================
export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User doesn’t exist" });
    }

    // 2. Generate a 10-minute Reset Token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // 3. Construct the Reset Link
   const resetLink = `${process.env.FRONTEND_URL}/Resetpassword/${resetToken}`;

    // 4. Send Email using your sendEmail utility (Mailtrap)
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Password Reset</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 0.8rem; color: #666;">This link will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ message: "Reset email sent to Mailtrap!" });
  } catch (error) {
    // This prints the actual error to your VS Code terminal
    console.error("Forget Password Error:", error.message);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// ================= RESET PASSWORD =================
export const Resetpassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Update Password
    user.password = password; 
    
    // IMPORTANT: If you use bcrypt in a pre-save hook, 
    // simply saving will hash it.
    await user.save(); 

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Link expired or invalid" });
  }
};