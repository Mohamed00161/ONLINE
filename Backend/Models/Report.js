import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  // Added: Categorize the report (Incident, Daily Summary, Tool Request)
  reportType: {
    type: String,
    enum: ["Daily Summary", "Incident", "Maintenance Request", "Other"],
    default: "Daily Summary"
  },
  // Added: So Admin can track if they've reviewed it
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Resolved"],
    default: "Pending"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true }); // Automatically adds updatedAt fields

const Report = mongoose.model("Report", reportSchema);
export default Report;