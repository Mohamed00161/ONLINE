import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import authRoute from "./Routes/auth.js";
import adminRoutes from "./Routes/admin.js";
import profileRoute from "./Routes/profile.js";
import complaintRoutes from "./Routes/complaint.js";
import passport from "./config/passport.js"
import sendEmail from "./utils/sendEmail.js"

dotenv.config();

const app = express(); 

// 1. MUST BE BEFORE ROUTES: Increase JSON limit for Base64 images
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(passport.initialize());
app.use(cookieParser());

// 2. CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://online-complaints-nu.vercel.app" // Use your actual main Frontend URL
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Connect Database
connectDB();

// Static Folders
app.use("/uploads", express.static("uploads"));

// 3. Routes
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api", profileRoute); // If profileRoute has router.put('/update'), this works.
app.use("/api/complaints", complaintRoutes);

// 4. Improved Error Handling (Logs the full stack trace for debugging)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR STACK:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


export default app;