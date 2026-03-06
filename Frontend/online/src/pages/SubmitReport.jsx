import React, { useState } from "react";
import axios from "axios";
import { FaPaperPlane, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";

const SubmitReport = () => {
  const [reportData, setReportData] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // POST URL for submitting report
      await axios.post("https://backend-ml27.onrender.com/api/reports/submit", reportData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Report submitted to Admin successfully!");
      setReportData({ title: "", description: "" });
    } catch (err) {
      alert("Error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <FaExclamationTriangle size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black italic">Submit Report</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Administrative Department</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Subject / Report Title"
          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500/20 font-bold text-sm"
          value={reportData.title}
          onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Describe the issue or update in detail..."
          className="w-full h-40 px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 ring-indigo-500/20 font-medium text-sm"
          value={reportData.description}
          onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
          required
        />
        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          {loading ? "Transmitting..." : <><FaPaperPlane /> Send Report</>}
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;