import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaSignInAlt, FaShieldAlt, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useTheme } from "../context/ThemeContext.jsx";

const Login = () => {
  const { darkMode } = useTheme();
  const [searchParams] = useSearchParams();  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Handle Google Auth Redirect Logic
  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");

    if (token && userRaw) {
      try {
        const userInfo = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem("token", token);
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        const userRole = userInfo.role ? userInfo.role.toLowerCase() : "user";
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "employee") {
          navigate("/employee");
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Google Auth Parsing Error:", error);
        setMessage("Failed to sync Google account details.");
      }
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = () => {
    // DIRECT URL for Google Login
    window.location.href = "https://backend-ml27.onrender.com/api/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("https://backend-ml27.onrender.com/api/auth/login", formData);
      
      const { token, role, name, avatar, _id, email } = res.data;
      
      localStorage.setItem("token", token);
      const userInfo = { _id, name, email, role, avatar };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      const userRole = role ? role.toLowerCase() : "user";
      if (userRole === "admin") navigate("/admin");
      else if (userRole === "employee") navigate("/employee");
      else navigate("/dashboard");

} catch (err) {
      console.error("Login Error:", err);
      
      // Better error handling to see if it's a 404 or a 500
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        setMessage(err.response.data?.message || `Server Error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        setMessage("No response from server. Check your internet or backend status.");
      } else {
        setMessage("Error setting up request.");
      }
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
            Connecting remote communities with digital infrastructure management and rapid complaint resolution.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 z-10">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-emerald-400 mb-8 transition-colors">
            <FaArrowLeft /> Back to home
          </Link>

          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 dark:text-emerald-400 font-black text-2xl tracking-tighter mb-10 lg:hidden">
                <FaShieldAlt /> FixIt.
            </Link>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm">Enter your credentials to access the rural service portal.</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm text-slate-700 dark:text-slate-200 hover:shadow-lg transition-all mb-6 active:scale-[0.98]"
          >
            <FcGoogle size={22} />
            Continue with Google
          </button>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Or use email login</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl text-xs font-bold animate-pulse">
               {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between px-1">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                <Link to="/forgotpassword" size="sm" className="text-indigo-600 dark:text-emerald-400 font-bold hover:underline text-xs">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium dark:text-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`group w-full relative h-14 mt-4 bg-indigo-600 dark:bg-emerald-600 rounded-2xl text-white font-black text-sm uppercase tracking-widest overflow-hidden transition duration-300 hover:opacity-90 active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="relative h-full flex flex-col justify-center items-center">
                  <div className="h-5 overflow-hidden relative">
                    <span className="flex items-center gap-2 transition-transform duration-300 group-hover:-translate-y-full">
                      <FaSignInAlt size={16} /> Log In
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300 translate-y-full group-hover:translate-y-0">
                      <FaSignInAlt size={16} /> Welcome
                    </span>
                  </div>
                </div>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Don’t have an account? <Link to="/signup" className="text-indigo-600 dark:text-emerald-400 font-black hover:underline underline-offset-4">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;