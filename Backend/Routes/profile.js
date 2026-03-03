import express from "express";
import protect from "../middleware/profilemiddleware.js"
import upload from "../middleware/upload.js";
import { getProfile, updateProfile,} from "../controllers/profileController.js"


const router = express.Router();

router.get('/profile', protect, getProfile);
router.put("/update", protect, upload.single("avatar"), updateProfile);

export default router;
