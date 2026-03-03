import Complaint from "../Models/Complaint.js";
import User from "../Models/User.js"; // Ensure User is imported for the login function
import mongoose from "mongoose";
import Report from "../Models/Report.js";

// ✅ 1. USER: CREATE COMPLAINT
export const createComplaint = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    const complaint = await Complaint.create({
      title,
      category,
      description,
      status: "Pending", // Default status
      user: req.user._id, // The person who filed it
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Failed to create complaint" });
  }
};

// ✅ 2. USER: GET OWN COMPLAINTS
export const getComplaint = async (req, res) => {
  try {
    // Standardize: Users look for complaints where 'user' matches their ID
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Error fetching complaints" });
  }
};

// ✅ 3. ADMIN: GET ALL COMPLAINTS
export const getAllComplaint = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name email")
      .populate("assignedEmployee", "name email"); // Also see who is working on it
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Error fetching all complaints" });
  }
};

// ✅ 4. ADMIN: ASSIGN COMPLAINT
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params; 
    const { employeeId } = req.body;

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { assignedEmployee: employeeId, status: "In Progress" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Assignment failed" });
  }
};

// ✅ 5. EMPLOYEE: GET ASSIGNED COMPLAINTS (The Fix for your Mismatch)
export const getAssignedComplaints = async (req, res) => {
  try {
    // We convert to string to ensure clean matching
    const employeeId = req.user._id.toString();

    const complaints = await Complaint.find({ 
      assignedEmployee: employeeId 
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ 6. UPDATE STATUS (Used by Admin or Employee)
// Example Backend Controller (Node/Express)
 export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body; // Capture the note
    
    // Find the complaint
    const complaint = await Complaint.findById(req.params.id);

    if (complaint) {
      complaint.status = status;
      
      // If a note was sent, save it (ensure your DB model has this field)
      if (resolutionNote) {
        complaint.resolutionNote = resolutionNote; 
        complaint.resolvedAt = Date.now();
      }

      const updatedComplaint = await complaint.save();
      res.json(updatedComplaint);
    } 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ 7. DELETE COMPLAINT
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByIdAndDelete(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    res.json({ message: "Complaint deleted successfully", _id: id });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


// Check your backend/controllers/complaintController.js
export const resolveComplaint = async (req, res) => {
  try {
    const { resolutionNote } = req.body; // <-- Is this being received?
    
    const updated = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        status: "Resolved", 
        resolutionNote, // <-- This MUST be saved here
        resolvedAt: new Date() 
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
};



// POST: Staff submitting a report
export const submitReport = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validation check
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const report = await Report.create({
      staffId: req.user._id, // Ensure "protect" middleware provides req.user
      title,
      description,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Error in submitReport:", error); // Check your terminal for this log!
    res.status(500).json({ message: "Server Error: Could not save report" });
  }
};

// GET: Admin fetching all reports
export const GetReport = async (req, res) => {
  const reports = await Report.find().populate("staffId", "name email");
  res.json(reports);
};