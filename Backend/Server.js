import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import path from "path";

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

// 2. CORS CONFIGURATION
// 2. CORS CONFIGURATION
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://online-backend-8khb.onrender.com" // Recommended: add your production URL too
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // 2. Check if the origin is in our allowed list
    const isAllowed = allowedOrigins.includes(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

// 3. MIDDLEWARE
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(passport.initialize());
app.use(cookieParser());

// 4. STATIC FOLDERS
app.use("/uploads", express.static("uploads"));

// 5. TEST ROUTE
app.get("/", (req, res) => {
  res.send("Online Complaints & Department Management Backend Running");
});

// 6. ROUTES
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoutes);
app.use("/api", profileRoute); 
app.use("/api/complaints", complaintRoutes);

// 7. ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  // If it's a CORS error, send a 403 instead of a 500 crash
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res.status(500).send({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;