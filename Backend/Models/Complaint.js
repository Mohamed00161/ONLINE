import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The person who filed the complaint
      required: true,
    },
    // ✅ ADDED THIS FIELD:
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the Employee user
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    // ✅ OPTIONAL: Add a field for employee remarks
    resolutionNotes: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);