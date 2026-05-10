import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String 
    },
    avatar: { 
      type: String, 
      default: "" 
    },
    role: {
      type: String,
      enum: ["admin", "manager", "deptmanager", "employee", "user"], 
      default: "user",
      lowercase: true 
    },
    department: { 
      type: String, 
      enum: ["Water", "Electricity", "Infrastructure", "Health", "Waste", "Roads", "None"],
      default: "None"
    },
    category: { 
      type: String, 
      default: "General" 
    }, 
    isActive: { 
      type: Boolean, 
      default: false 
    },
    // --- TOKEN FIELDS ---
    inviteToken: { 
      type: String, 
      index: true 
    }, 
    setupToken: { 
      type: String, 
      index: true 
    }, 
    inviteExpires: { 
      type: Date 
    },
  },
  { timestamps: true }
);

// --- HASHING & STATUS MIDDLEWARE ---
// FIX: Removed 'next' as an argument. Async hooks handle completion via Promise resolution.
userSchema.pre("save", async function () {
  
  // 1. Only hash if the password is new or has been changed
  if (!this.isModified("password")) {
    return; 
  }

  // 2. Logic for isActive
  if (this.password && !this.password.startsWith("pending_")) {
    this.isActive = true;
  }

  try {
    // 3. Hashing the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // In an async hook, simply finishing the function is equivalent to calling next().
  } catch (error) {
    // Throwing an error inside an async hook correctly passes it to the next error middleware.
    throw new Error("Password hashing failed: " + error.message);
  }
});

// --- HELPER METHODS ---
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;