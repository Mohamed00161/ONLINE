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
import passport from "./config/passport.js";

dotenv.config();
const app = express(); 

// 1. CONNECT DATABASE
connectDB();

const allowedOrigins = [
  "https://online-complaints-nu.vercel.app",
  
];

// 2. CORS CONFIGURATION (MUST BE FIRST!)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 3. MIDDLEWARE
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(passport.initialize());
app.use(cookieParser());

// 4. STATIC FOLDERS
app.use("/uploads", express.static("uploads"));

// 5. TEST ROUTE
app.get("/test", (req, res) => {
  res.send("Server is alive and reaching this point!");
});

// 6. ROUTES (MUST BE AFTER CORS)
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api", profileRoute); 
app.use("/api/complaints", complaintRoutes);

// 7. START SERVER (REMOVED THE DUPLICATE LISTEN)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;