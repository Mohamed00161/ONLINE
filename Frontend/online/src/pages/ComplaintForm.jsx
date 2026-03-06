import { useState } from "react";
import { FaPaperPlane, FaHeading, FaTags, FaAlignLeft } from "react-icons/fa";

const SubmitComplaint = ({ fetchComplaints }) => {
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://backend-ml27.onrender.com/api/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      setForm({ title: "", category: "", description: "" });
      if (fetchComplaints) fetchComplaints(); 
      alert("Complaint filed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* We use max-w-md to keep it narrow and mx-auto to center it */
    <div className="max-w-md mx-auto bg-white p-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compact Header */}
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            New Ticket
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Fill in the details below to alert our team.
          </p>
        </div>

        {/* Title Input - Reduced Padding */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <FaHeading className="text-indigo-500" /> Title
          </label>
          <input
            name="title"
            placeholder="What's the issue?"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700"
          />
        </div>

        {/* Category Dropdown - Reduced Padding */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <FaTags className="text-indigo-500" /> Category
          </label>
          <div className="relative">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700 cursor-pointer"
            >
              <option value="" disabled>Select Department</option>
              <option value="Water">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Road">Infrastructure</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Waste">Waste</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Description Textarea - Reduced Rows */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <FaAlignLeft className="text-indigo-500" /> Description
          </label>
          <textarea
            name="description"
            placeholder="Provide details..."
            value={form.description}
            onChange={handleChange}
            required
            rows={3} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
          />
        </div>

        {/* Submit Button - More Compact */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 mt-2
            ${loading 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
            }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
          ) : (
            <>
              <FaPaperPlane className="text-[10px]" />
              Submit Ticket
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitComplaint;