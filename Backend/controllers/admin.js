import Complaint from "../Models/Complaint.js";
import User from "../Models/User.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

/* ================= GET ALL COMPLAINTS ================= */
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= INVITE EMPLOYEE ================= */
export const inviteEmployee = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { name, email, department } = req.body;
    if (!name || !email || !department)
      return res.status(400).json({ message: "Name, email and department are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Employee already exists" });

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const employee = await User.create({
      name,
      email,
      department,
      role: "employee",
      password: hashedPassword,
      inviteToken,
      inviteExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h expiry
      isActive: false,
    });

    const inviteLink = `http://localhost:5173/employee/register/${inviteToken}`;

    await sendEmail({
      to: email,
      subject: "Employee Invitation",
      html: `
        <h3>Hello ${name},</h3>
        <p>You are invited to join the Complaint System.</p>
        <p><a href="${inviteLink}">Click here to register</a></p>
        <p>Expires in 24 hours.</p>
      `,
    });

    res.status(201).json({ message: "Invitation sent successfully" });
} catch (err) {
    console.error("INVITE ERROR DETAILS:", err);
    // This sends the actual error message (e.g., from Resend) back to your frontend
    res.status(400).json({ 
      message: err.message || "Email delivery failed. Check Resend configuration.",
      error: err 
    });
  }
};

/* ================= RESEND INVITE ================= */
export const resendInvite = async (req, res) => {
  try {
    // 1. Admin Check
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2. Find the employee by ID from the URL
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (employee.isActive) {
      return res.status(400).json({ message: "Employee is already active/registered" });
    }

    // 3. Generate New Token and Expiry
    const newInviteToken = crypto.randomBytes(32).toString("hex");
    employee.inviteToken = newInviteToken;
    employee.inviteExpires = Date.now() + 24 * 60 * 60 * 1000; // Reset 24h timer
    
    await employee.save();

    // 4. Send Email
    const inviteLink = `http://localhost:5173/employee/register/${newInviteToken}`;

    await sendEmail({
      to: employee.email,
      subject: "New Employee Invitation Link",
      html: `
        <h3>Hello ${employee.name},</h3>
        <p>Your invitation link has been refreshed.</p>
        <p><a href="${inviteLink}">Click here to register</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    res.status(200).json({ message: "Invitation resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during resend" });
  }
};
/* ================= GET EMPLOYEES ================= */
export const getEmployees = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const employees = await User.find({ role: "employee" }).select("-password");
    res.json(employees);
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= REGISTER EMPLOYEE ================= */
export const registerEmployee = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const employee = await User.findOne({ inviteToken: token });

    if (!employee) {
      return res.status(400).json({ message: "Invalid invitation link" });
    }

    if (employee.inviteExpires < Date.now()) {
      return res.status(400).json({ message: "Invitation link expired" });
    }

    if (employee.isActive) {
      return res.status(400).json({ message: "Account already activated" });
    }

    employee.password = await bcrypt.hash(password, 10);
    employee.inviteToken = undefined;
    employee.inviteExpires = undefined;
    employee.isActive = true;

    await employee.save();

    res.json({ message: "Account created successfully" });
  } catch (err) {
    console.error("REGISTER EMPLOYEE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= DELETE EMPLOYEE ================= */
export const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.deleteOne();
    res.json({ message: "Employee deleted" });
  } catch (err) {
    console.error("DELETE EMPLOYEE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
