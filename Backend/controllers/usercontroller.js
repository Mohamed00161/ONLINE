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

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2. Find User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Employee Setup Check
    if (user.role === "employee" && (!user.password || !user.isActive)) {
      return res.status(403).json({
        message: "Please complete account setup using the email invitation.",
      });
    }

    // 4. Password Verification
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 6. SUCCESS RESPONSE (The Fix is here)
    // We check if avatar is a Cloudinary URL (starts with http) or a local path
    const avatarUrl = user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('https'))
      ? user.avatar 
      : user.avatar ? `http://localhost:5000${user.avatar}` : null;

    res.json({
      message: "Login successful",
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: avatarUrl, // This will now correctly show Cloudinary images
      joined: user.createdAt,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// forget password

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User doesn’t exist" });
    }

    // generate reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    // configure transporter
  // Looking to send emails in production? Check out our Email API/SMTP product!
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "9c996bc04a2585",
        pass: "bd9e5e5b02d4d7"
      }
    });

    // send email
    await transporter.sendMail({
      from: "support@test.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Click this link to reset your password: <a href="http://localhost:5173/Resetpassword/${resetToken}">Reset Password</a></p>`,
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

    // verify token
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(verifiedToken.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password has been reset successfully ✅" });
  } catch (err) {
    console.error(err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired ❌" });
    }
    res.status(500).json({ message: "Internal server error ❌" });
  }
};

