import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext.jsx";

const ForgotPassword = () => {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await axios.post("https://backend-ml27.onrender.com/api/auth/forgetpassword", { email });
      setStatus({ 
        type: "success", 
        msg: "Recovery link sent! Please check your inbox (and spam folder)." 
      });
    } catch (err) {
      setStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Something went wrong. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      
      {/* LEFT SIDE: HERO SECTION */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/login.png" 
            alt="Security"
            className="w-full h-full object-cover grayscale-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-slate-50 dark:to-slate-950"></div>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <Link to="/" className="group inline-flex flex-col items-start mb-12">
            <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30 shadow-2xl group-hover:bg-white/30 transition-all">
              <FaShieldAlt size={32} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] drop-shadow-lg">
              Secure <br /><span className="text-amber-400">Recovery.</span>
            </h1>
          </Link>
          <p className="text-white text-lg font-bold leading-relaxed drop-shadow-md bg-black/20 p-6 rounded-3xl backdrop-blur-sm border border-white/10">
            Forgot your access key? Don't worry. We'll verify your identity and get you back into the portal in minutes.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 z-10">
        <div className="w-full max-w-md">
          
          <Link to="/login" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-amber-400 mb-8 transition-colors">
            <FaArrowLeft /> Back to Login
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Recover Access</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm">
              Enter the email associated with your account to receive a reset link.
            </p>
          </div>

          {status.msg && (
            <div className={`mb-8 p-5 rounded-2xl flex items-start gap-3 text-sm font-bold ${
              status.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" 
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
            }`}>
              {status.type === "success" ? <FaCheckCircle className="mt-1" /> : <FaShieldAlt className="mt-1" />}
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Registered Email Address</label>
              <input
                type="email"
                placeholder="yourname@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full relative h-14 bg-indigo-600 dark:bg-amber-600 rounded-2xl text-white font-black text-sm uppercase tracking-widest overflow-hidden transition duration-300 hover:opacity-90 active:scale-95 shadow-xl disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="relative h-full flex flex-col justify-center items-center">
                  <div className="h-5 overflow-hidden relative">
                    <span className="flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <FaPaperPlane size={14} /> Send Link
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                      CheckInbox
                    </span>
                  </div>
                </div>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Remembered your password? <Link to="/login" className="text-indigo-600 dark:text-amber-400 font-black hover:underline underline-offset-4">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;