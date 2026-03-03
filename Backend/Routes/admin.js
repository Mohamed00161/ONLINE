import express from "express";
import { getComplaint, } from "../controllers/complaint.js"
import User from "../Models/User.js"
import protect   from "../middleware/authmiddleware.js"
import {deleteEmployee, getEmployees, inviteEmployee ,registerEmployee,resendInvite} from "../controllers/admin.js"


const router = express.Router();


router.get("/employees", protect,getEmployees)
router.post("/employees", protect, inviteEmployee);
router.delete("/employees/:id", protect, deleteEmployee);
router.post("/employee/register/:token",registerEmployee);
router.post("/employees/:id/resend", protect, resendInvite);


  
export default router;
