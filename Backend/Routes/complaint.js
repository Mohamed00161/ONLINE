import express from "express";
import { getComplaint, submitReport, createComplaint, getAllComplaint, updateComplaintStatus, deleteComplaint, getAssignedComplaints ,assignComplaint, resolveComplaint, GetReport } from "../controllers/complaint.js"
import protect from "../middleware/authmiddleware.js";


const router = express.Router();

// Submit complaint (protected)
router.post("/", protect,  createComplaint);
router.get("/my",  protect, getComplaint);

// Get complaints (protected or admin-only later)
router.get("/",protect, getAllComplaint)

router.put("/:id/status", protect, updateComplaintStatus);

router.delete("/:id", protect, deleteComplaint);

// router.get("/assigned", protect, assignComplaint);

// 1. Route for Employee to fetch THEIR tasks
router.get("/assigned", protect, getAssignedComplaints);

// 2. Route for Admin to assign A task (POST matches your AdminDashboard call)
router.post("/:id/assign", protect, assignComplaint);

router.put("/:id/resolve", protect, resolveComplaint);
 
router.post("/submit", protect, submitReport);

router.get("/admin/all", protect ,GetReport)


export default router;
