import Complaint from "../Models/Complaint.js";
import User from "../Models/User.js";
import Report from "../Models/Report.js";

// ✅ 1. USER: CREATE COMPLAINT
export const createComplaint = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    const complaint = await Complaint.create({
      title,
      category,
      description,
      user: req.user._id,
      status: "Pending",
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to create complaint" });
  }
};

// ✅ 2. SUPER ADMIN: ASSIGN TO A DEPARTMENT
export const assignToDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department } = req.body; // The value from your Admin dropdown (e.g., "Electricity")

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { 
        // FIX: Change 'department' to 'assignedDepartment'
        assignedDepartment: department, 
        status: "Assigned to Dept" 
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Admin Routing Error:", err);
    res.status(500).json({ message: "Routing failed", error: err.message });
  }
};


// ✅ 3. DEPT MANAGER: GET COMPLAINTS FOR THEIR DEPT
export const getDeptComplaints = async (req, res) => {
  try {
    const { department } = req.user; 
    const complaints = await Complaint.find({ assignedDepartment: department })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching department complaints" });
  }
};

// ✅ 4. DEPT MANAGER: ASSIGN TO SPECIFIC EMPLOYEE
export const assignToEmployee = async (req, res) => {
  try {
    const { id } = req.params; 
    const { employeeId } = req.body;

    // 1. Logic Check: Find and update
    const updated = await Complaint.findByIdAndUpdate(
      id,
      { 
        assignedEmployee: employeeId, 
        status: "In Progress" 
      },
      { new: true, runValidators: true }
    );

    // 2. Explicit 404 Check
    if (!updated) {
      return res.status(404).json({ message: "Complaint ID not found in database." });
    }

    res.json(updated);
  } catch (err) {
    console.error("Assignment Error:", err);
    res.status(500).json({ message: "Employee assignment failed due to server error." });
  }
};

// ✅ 5. EMPLOYEE: SUBMIT WORK PROOF
// Backend snippet example
export const resolveComplaint = async (req, res) => {
  const { resolutionNotes, status } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id, 
    { resolutionNotes, status, updatedAt: Date.now() }, 
    { new: true }
  );
  res.json(complaint);
};

// ✅ 6. ADMIN/USER: FINAL RESOLUTION
export const finalCloseComplaint = async (req, res) => {
    try {
      const updated = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status: "Resolved" },
        { new: true }
      );
      res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ✅ 7. EMPLOYEE: GET THEIR SPECIFIC ASSIGNED TASKS
export const getAssignedComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ 
      assignedEmployee: req.user._id 
    }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching assigned tasks" });
  }
};

// ✅ 8. UTILITY: DELETE COMPLAINT
export const deleteComplaint = async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ✅ 9. REPORTS: SUBMIT AND GET (Fixing your SyntaxError)
export const submitReport = async (req, res) => {
  try {
    const { title, description } = req.body;
    const report = await Report.create({
      staffId: req.user._id,
      title,
      description,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: "Could not save report" });
  }
};

export const GetReport = async (req, res) => {
  try {
    const reports = await Report.find().populate("staffId", "name email");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports" });
  }
};


export const getComplaint = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'manager' || req.user.role === 'deptmanager') {
      const managerDept = req.user.department?.trim();
      if (!managerDept || managerDept === "None") return res.json([]);

      query = { 
        assignedDepartment: { $regex: new RegExp(`^${managerDept}$`, 'i') } 
      };
    } 
    else if (req.user.role === 'admin') {
      query = {}; 
    } 
    else {
      query = { user: req.user._id };
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('assignedEmployee', 'name email');

    // Comment these out if you want a clean terminal
    // console.log(`RESULT: Found ${complaints.length} complaints.`);

    res.json(complaints);
  } catch (error) {
    console.error("FETCH ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllComplaint = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name email")
      .populate("assignedEmployee", "name email");
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: "Error fetching all" }); }
};



