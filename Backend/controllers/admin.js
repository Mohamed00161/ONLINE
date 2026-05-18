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
// controllers/admin.js


export const inviteDeptManager = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    // 1. Validation
    if (!name || !email || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already registered" });
    }

    // 2. Generate a Secure Token
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Create the placeholder Manager in the Database
    await User.create({
      name,
      email,
      department,
      role: "manager", 
      isActive: false,
      setupToken: token, 
      inviteExpires: Date.now() + 24 * 60 * 60 * 1000 // Expires in 24 hours
    });

    // 4. Define setupUrl using Environment Variables for Production/Development
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupUrl = `${frontendUrl}/employee/register/${token}`;

    // 5. Enhanced HTML Message
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h1 style="color: #1e293b; font-size: 24px;">Welcome to the Team, ${name}!</h1>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          You have been invited as the <strong>Manager</strong> for the <strong>${department}</strong> department at FixIt HQ.
        </p>
        <p style="color: #475569; font-size: 16px; margin-bottom: 30px;">
          Please click the button below to set up your password and activate your account:
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${setupUrl}" 
             style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
             Activate Manager Account
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <strong>Note:</strong> This link will expire in 24 hours.<br><br>
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${setupUrl}" style="color: #4f46e5;">${setupUrl}</a>
        </p>
      </div>
    `;

    // 6. Send the email
    await sendEmail({
      email: email,
      subject: "Manager Invitation - FixIt HQ",
      message: message
    });

    res.status(200).json({ message: "Manager invited successfully" });
  } catch (error) {
    console.error("INVITE ERROR:", error); 
    res.status(500).json({ message: "Failed to send invitation. Please try again." });
  }
};

export const inviteEmployee = async (req, res) => {
  try {
    const { name, email, department, category } = req.body;

    // 1. Validation
    if (!name || !email || !department) {
       return res.status(400).json({ message: "Name, Email, and Department are required." });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ message: "User already registered" });

    // 2. Generate a SECURE, unique token and store it
    const setupToken = crypto.randomBytes(32).toString("hex");

    // 3. Create the record with the token
    await User.create({
      name,
      email: email.toLowerCase(),
      department: department || "None", 
      category: category || "General",
      role: "employee",
      isActive: false, // Set to false until they register!
      status: "Pending",
      setupToken: setupToken // Save this so we can verify the link later
    });

    // 4. Define setupUrl using Environment Variables for Production/Development
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setupUrl = `${frontendUrl}/employee/register/${setupToken}`;

    const emailDeptName = department !== "None" ? department : "our Maintenance Team";

    // 5. The Email Template
    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center;">FIXIT HQ</h2>
        <h1 style="font-size: 20px; color: #0f172a;">Welcome aboard, ${name}!</h1>
        <p>You have been invited to the <strong>${emailDeptName}</strong> department as a <strong>${category}</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Activate My Account
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">If the button doesn't work, copy this link: ${setupUrl}</p>
      </div>
    `;

    await sendEmail({
      email: email,
      subject: `Action Required: Activate your ${emailDeptName} account`,
      message: message
    });

    res.status(200).json({ message: "Invitation sent successfully to " + email });
  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ message: "Server error during invitation." });
  }
};

/* ================= RESEND INVITE ================= */
export const resendInvite = async (req, res) => {
  try {
    // 1. Authorization: Admin or Managers only
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager" || req.user.role === "dept-manager";

    if (!isAdmin && !isManager) {
      return res.status(403).json({ message: "Access denied." });
    }

    // 2. Retrieval: Use ID from URL params (matches /employees/:id/resend)
    const { id } = req.params;
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // 3. Security: Managers can only resend to their own department
    if (isManager && !isAdmin && employee.department !== req.user.department) {
      return res.status(403).json({ 
        message: "Access denied: You can only manage users within your own department." 
      });
    }

    // 4. Logic: Don't resend if already active
    if (employee.isActive) {
      return res.status(400).json({ message: "This user has already activated their account." });
    }

    // 5. Token Refresh
    const newInviteToken = crypto.randomBytes(32).toString("hex");
    employee.inviteToken = newInviteToken;
    employee.inviteExpires = Date.now() + 24 * 60 * 60 * 1000; // 24-hour expiry

    await employee.save();

    // 6. Link Construction using Environment Variables
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const rolePath = employee.role === 'manager' ? 'manager' : 'employee';
    const inviteLink = `${frontendUrl}/${rolePath}/register/${newInviteToken}`;

    // 7. Dispatch Email with Styled Button
    await sendEmail({
      email: employee.email, // Updated 'to' to 'email' to match your updated sendEmail utility
      subject: "Action Required: Your Registration Link is Ready",
      message: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 10px;">Welcome to the Team!</h1>
            <p style="font-size: 16px; color: #666;">You've been invited to join the <strong>${employee.department}</strong> department.</p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; border: 1px solid #edf2f7; text-align: center;">
            <p style="margin-bottom: 25px; font-size: 16px;">Please click the button below to complete your registration and set up your account password.</p>
            
            <a href="${inviteLink}" 
               style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
               Complete Registration
            </a>

            <p style="margin-top: 25px; font-size: 14px; color: #9ca3af;">This link will expire in 24 hours.</p>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="font-size: 13px; color: #666;">
              If the button doesn't work, copy and paste this link into your browser:
              <br />
              <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: "Invitation link resent successfully." });

  } catch (err) {
    console.error("Resend Error:", err);
    
    // Check if error is SMTP provider rate limiting
    if (err.responseCode === 550) {
      return res.status(429).json({ 
        message: "Email provider busy. Link updated in DB, but email failed to send. Please try again in 1 minute." 
      });
    }

    return res.status(500).json({ message: "Internal server error." });
  }
};

/* ================= GET EMPLOYEES ================= */
export const getEmployees = async (req, res) => {
  try {
    // Check if the role is EITHER admin OR DeptManager
    if (req.user.role !== "admin" && req.user.role !== "manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Logic: If they are a DeptManager, only show employees in their department
    // If they are an admin, show all employees
    let query = { role: "employee" };
    
    if (req.user.role === "manager") {
      query.department = req.user.department;
    }

    const employees = await User.find(query).select("-password");
    res.json(employees);
  } catch (err) {
    console.error("GET EMPLOYEES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= REGISTER EMPLOYEE ================= */
// Controllers/adminController.js
export const registerEmployee = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // 1. Clean the token (removes the :1 from the browser error)
  const cleanToken = token ? token.trim().split(':')[0] : null;

try {
  const user = await User.findOne({
    $or: [{ inviteToken: cleanToken }, { setupToken: cleanToken }]
  });

  if (!user) return res.status(404).json({ message: "Invalid link." });

  // 1. Assign PLAIN TEXT password (the Schema hook will hash this)
  user.password = password; 
  user.isActive = true; 
  
  // 2. Clear tokens
  user.inviteToken = undefined;
  user.setupToken = undefined;
  user.inviteExpires = undefined;

  // 3. Save (The pre-save hook triggers here!)
  await user.save();
  
  res.status(200).json({ message: "Account activated!" });
} catch (error) {
  console.error("🔴 Error:", error);
  res.status(500).json({ message: "Internal server error." });
}}


/* ================= DELETE EMPLOYEE ================= */
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 1. Check Permissions
    const isAdmin = req.user.role === "admin";
    const isDeptManager = req.user.role === "dept_manager"; // Ensure this matches your DB role string
    const isSameDept = req.user.department === employee.department;

    // Grant access if User is Admin OR (User is Manager AND in the same Dept)
    if (!isAdmin && !(isDeptManager && isSameDept)) {
      return res.status(403).json({ 
        message: "Access denied: You can only delete employees within your own department." 
      });
    }

    // 2. Perform Deletion
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("DELETE EMPLOYEE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('staffId', 'name email department role') // Get specific fields from User
      .sort({ createdAt: -1 }); // Newest reports first

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
};


// Example Controller Logic
export const getManagers = async (req, res) => {
  try {
    // This assumes your User model has a 'role' field
    const managers = await User.find({ role: 'manager' })
      .select('-password'); // Never send passwords to the frontend
    
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch managers" });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.params;
  console.log("Checking Token:", token);

  try {
    // Phase 1: Search without the expiry filter
    const user = await User.findOne({
      $or: [{ inviteToken: token }, { setupToken: token }]
    });

    if (!user) {
      console.log("❌ DB MATCH FAIL: No user found with that token string.");
      return res.status(404).json({ message: "Invalid link: Token mismatch." });
    }

    // Phase 2: Check expiry separately
    const now = Date.now();
    if (user.inviteExpires && user.inviteExpires < now) {
      console.log(`❌ EXPIRY FAIL: Token expired at ${user.inviteExpires}. Current time is ${now}`);
      return res.status(404).json({ message: "Link expired." });
    }

    console.log("✅ SUCCESS: Found user", user.email);
    res.status(200).json({ name: user.name, email: user.email });

  } catch (error) {
    console.error("DEBUG ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};