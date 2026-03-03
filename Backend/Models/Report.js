import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", reportSchema);
export default Report; // This allows "import Report from..." to work