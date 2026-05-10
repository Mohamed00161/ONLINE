import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../Models/User.js";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB || process.env.MONGO_URI; // Check both common names
    
    if (!mongoUri) {
      throw new Error("MONGODB URI is missing in .env. Check if your variable is named MONGODB or MONGO_URI");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    const adminEmail = "admin@system.com";

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log("✅ Admin already exists");
      mongoose.connection.close();
      process.exit();
    }

    // ✅ DO NOT USE BCRYPT HERE. 
    // The User Model's pre-save hook will hash this for you automatically.
    await User.create({
      name: "System Admin",
      email: adminEmail,
      password: "Admin123!", 
      role: "admin",
      isActive: true // Ensure admin is active immediately
    });

    console.log("✅ Admin created successfully (Password: Admin123!)");
    mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();