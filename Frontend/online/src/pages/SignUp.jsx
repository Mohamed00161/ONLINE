import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaUserPlus, FaShieldAlt, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "../context/ThemeContext.jsx";

const Signup = () => {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignup = () => {
    // Direct URL for Google Auth
    window.location.href = "https://online-backend-8khb.onrender.com/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      // --- DIRECT URL AS REQUESTED ---
      const res = await axios.post("https://online-backend-8khb.onrender.com/api/auth/signup", formData);
      
      setStatus({ 
        type: "success", 
        msg: res.data.message || "Account created! Redirecting to login..." 
      });
      
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Signup failed. Please try again." 
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
            src="/images/sign.png" 
            alt="Rural Infrastructure"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-slate-50 dark:to-slate-950 transition-colors duration-500"></div>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <Link to="/" className="group inline-flex flex-col items-start mb-12">
            <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/30 shadow-2xl group-hover:bg-white/30 transition-all">
              <FaShieldAlt size={32} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-[0.9] drop-shadow-lg">
              FixIt <br /><span className="text-emerald-400">Rural Link.</span>
            </h1>
          </Link>

          <p className="text-white text-lg font-bold leading-relaxed drop-shadow-md bg-black/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            Standardizing rural development through community accountability and digital transparency.
          </p>
          
          <div className="mt-8 space-y-3">
             <FeaturePoint text="Real-time status updates" />
             <FeaturePoint text="Direct communication with staff" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: SIGNUP FORM SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 z-10">
        <div className="w-full max-w-md">
          
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 mb-8 transition-colors">
            <FaArrowLeft /> Back to home
          </Link>

          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 dark:text-emerald-400 font-black text-2xl tracking-tighter mb-8 lg:hidden">
                <FaShieldAlt /> FixIt.
            </Link>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Create Account</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm">Join the network for rural infrastructure growth.</p>
          </div>

          <button
            onClick={handleGoogleSignup}
            type="button"
            className="group w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 hover:shadow-xl hover:border-indigo-200 dark:hover:border-emerald-500/30 transition-all mb-6 active:scale-[0.98]"
          >
            <FcGoogle size={22} className="group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Or use email</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {status.msg && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
              status.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800" 
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800"
            }`}>
              {status.type === "success" ? <FaCheckCircle /> : <FaShieldAlt />}
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group w-full relative h-14 mt-4 bg-indigo-600 dark:bg-emerald-600 rounded-2xl text-white font-black text-sm uppercase tracking-widest overflow-hidden transition duration-300 hover:opacity-90 active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="relative h-full flex flex-col justify-center items-center">
                  <div className="h-5 overflow-hidden relative">
                    <span className="flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <FaUserPlus size={16} /> Get Started
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                      <FaUserPlus size={16} /> Join Now
                    </span>
                  </div>
                </div>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Already a member?{" "}
            <Link to="/login" className="text-indigo-600 dark:text-emerald-400 font-black hover:underline underline-offset-4">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const FeaturePoint = ({ text }) => (
  <div className="flex items-center gap-3 text-white text-sm font-bold">
    <div className="bg-emerald-500 p-1 rounded-full shadow-lg"><FaCheckCircle size={10} className="text-white" /></div>
    {text}
  </div>
);

export default Signup;