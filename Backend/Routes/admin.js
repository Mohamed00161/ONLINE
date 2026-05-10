import express from "express";
import { getComplaint, } from "../controllers/complaint.js"
import User from "../Models/User.js"
import {protect, authorize}   from "../middleware/authmiddleware.js"
import {deleteEmployee, getEmployees, 
    inviteEmployee ,registerEmployee,
    inviteDeptManager,resendInvite, 
    getManagers,verifyToken} from "../controllers/admin.js"


const router = express.Router();


// Allow both Admin AND Manager to see the employee list
router.get("/employees", protect, authorize("admin", "manager"), getEmployees);
router.post("/employees", protect, inviteEmployee);
router.delete("/employees/:id", protect, deleteEmployee);
router.get("/employee/register/:token", verifyToken);
router.post("/employee/register/:token",registerEmployee);
router.post("/employees/:id/resend", protect, resendInvite);
router.post("/invite-manager", protect, inviteDeptManager);

router.get("/test", (req, res) => res.send("Admin Route is working!"));
  
router.get('/managers', protect,  getManagers);
router.post('/resend-invite', protect,  resendInvite);


export default router;
