import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../Models/User.js";


dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const createAdmin = async () => {
  try {
    if (!process.env.MONGODB) {
      throw new Error("MONGODB URI is missing in .env");
    }

    // Connect to MongoDB (no options needed in Mongoose v7+)
    await mongoose.connect(process.env.MONGODB);

    const adminEmail = "admin@system.com";

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log("✅ Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    await User.create({
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
