import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaLock, FaShieldAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", msg: "Passwords do not match ❌" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `https://online-backend-8khb.onrender.com/api/auth/Resetpassword/${token}`,
        { password }
      );
      
      setStatus({ type: "success", msg: res.data.message || "Password updated! Redirecting..." });

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Link expired or invalid ❌" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Added transition-colors and dark:bg-slate-950 */
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans transition-colors duration-300">
      
      {/* Added dark:bg-slate-900 and dark:border-slate-800 */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl dark:shadow-none w-full max-w-md border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

        <div className="text-center mb-8">
          {/* Added dark:bg-slate-800 and dark:border-slate-700 */}
          <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-slate-700">
            <FaShieldAlt size={28} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Set New Password</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Please enter your new secure credentials.</p>
        </div>

        {status.msg && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
            status.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" 
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
          }`}>
            {status.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              /* Added dark styles for input */
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            /* Adjusted shadow for dark mode */
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl dark:shadow-none
              ${loading 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
            ) : (
              <>
                <FaLock /> Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;