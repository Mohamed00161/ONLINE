import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/User.js"
import nodemailer from 'nodemailer';

// ================= SIGNUP (USERS ONLY) =================
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "user",
  });

  res.status(201).json({ message: "Signup successful" });
};

// ================= LOGIN (USER + ADMIN + EMPLOYEE) =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role === "employee" && (!user.password || !user.isActive)) {
      return res.status(403).json({
        message: "Please complete account setup using the email invitation.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // FIX: Removed hardcoded 'localhost:5000'. 
    // If not a Cloudinary URL, it uses the Render URL or just the path.
    const avatarUrl = user.avatar && (user.avatar.startsWith('http'))
      ? user.avatar 
      : user.avatar ? `${process.env.BACKEND_URL}${user.avatar}` : null;

    res.json({
      message: "Login successful",
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: avatarUrl,
      joined: user.createdAt,
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User doesn’t exist" });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // FIX: In production, use your real email service credentials (like Resend or Gmail)
    // instead of the Mailtrap sandbox which only you can see.
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Example: using Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // FIX: Changed localhost:5173 to your actual Vercel Frontend URL
    const resetLink = `${process.env.FRONTEND_URL}/Resetpassword/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click this link to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
    });

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    console.error("Forget Password Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= RESET PASSWORD =================
export const Resetpassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ message: "Token is missing" });

    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verifiedToken.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password has been reset successfully ✅" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired ❌" });
    }
    res.status(500).json({ message: "Internal server error ❌" });
  }
};