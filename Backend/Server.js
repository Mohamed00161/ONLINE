import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import authRoute from "./Routes/auth.js"
import adminRoutes from "./Routes/admin.js"
import profileRoute from "./Routes/profile.js"
import complaintRoutes from "./Routes/complaint.js"
import passport from './config/passport.js'
import sendEmail from "./utils/sendEmail.js"

dotenv.config();

const app = express(); 

// 1. MUST BE BEFORE ROUTES: Increase JSON limit for Base64 images
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(passport.initialize());
app.use(cookieParser());



// REMOVE or wrap the app.listen:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Running on ${PORT}`));
}
// Connect Database
connectDB();

// Static Folders
app.use("/uploads", express.static("uploads"));

// 3. Routes
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api", profileRoute); // If profileRoute has router.put('/update'), this works.
app.use("/api/complaints", complaintRoutes);

app.use(cors({
  origin: [
    "https://online-complaints-nu.vercel.app", // Your main domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Add this right after the cors() line to handle Preflight manually


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


export default app;