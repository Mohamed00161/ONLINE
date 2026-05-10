import express from "express";
import { 
  getComplaint, 
  submitReport, 
  createComplaint, 
  getAllComplaint, 
  deleteComplaint, 
  getAssignedComplaints,
  assignToDepartment,    // Updated: Admin to Dept
  getDeptComplaints,     // New: Dept Manager view
  assignToEmployee,      // Updated: Dept to Employee
  resolveComplaint,      // Updated: Employee finishes
  finalCloseComplaint,   // New: Final verification
  GetReport, 
  
  
} from "../controllers/complaint.js"
import {protect, authorize}   from "../middleware/authmiddleware.js"

const router = express.Router();

// --- USER ROUTES ---
router.post("/new", protect, createComplaint);         // File a new complaint
router.get("/my", protect, getComplaint);           // View my own history

// --- SUPER ADMIN ROUTES ---
router.get("/all", protect, getAllComplaint);      // See everything in the system

router.put('/:id/assign-dept', protect, assignToDepartment);

router.delete("/:id", protect, deleteComplaint);    // Remove a complaint


router.put("/:id/assign-worker", protect, assignToEmployee);

// --- EMPLOYEE ROUTES ---
router.get("/assigned", protect, getAssignedComplaints); // View my daily tasks
router.put("/:id/resolve", protect, resolveComplaint);   // Upload photo & notes

// --- FINAL VERIFICATION ---
router.put("/:id/close", protect, finalCloseComplaint);  // Mark as fully resolved

// --- REPORTS ---
router.post("/submit", protect, submitReport);
router.get("/Report", protect, GetReport);

export default router;