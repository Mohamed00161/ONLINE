import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    
    // ✅ ADD THIS FOR CLOUDINARY
    avatar: { 
      type: String, 
      default: "" 
    },

    role: {
      type: String,
      enum: ["admin", "employee", "user"],
      default: "employee",
    },
    department: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    inviteToken: { type: String },
    inviteExpires: { type: Date },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);