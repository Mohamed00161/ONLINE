import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    
    // 1. WHICH DEPARTMENT OWNS THIS? (Water, Electricity, etc.)
assignedDepartment: {
  type: String,
  enum: ["Water", "Electricity", "Infrastructure", "Health", "Waste", "None"], // Added Waste
  default: "None",
},

    // 2. WHICH EMPLOYEE IS DOING THE WORK?
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null,
    },

    // 3. UPDATED STATUSES FOR BETTER TRACKING
    status: {
      type: String,
      enum: ["Pending", "Assigned to Dept", "In Progress", "Completed", "Resolved"],
      default: "Pending",
    },

    // 4. PROOF OF WORK (The image the employee takes)
    resolutionImage: {
      type: String, // URL of the image (Cloudinary or local path)
      default: "",
    },

    // 5. REMARKS FROM THE EMPLOYEE
    resolutionNotes: {
      type: String,
      default: "",
    },

    // 6. DATE TRACKING
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);