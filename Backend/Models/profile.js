import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Removed required: true because Google Users don't have passwords
      required: function() { return !this.googleId; } 
    },
    googleId: {
      type: String,
    },
    role: {
      type: String,
      // Added 'Employee' and kept lowercase to match your frontend logic
      enum: ["user", "admin", "employee"], 
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Changed "profile" to "User" to match standard authentication practices
export default mongoose.model("User", userSchema);