import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { FaLock, FaUserCheck, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";

const EmployeeRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`https://online-backend-8khb.onrender.com/api/admin/employee/register/${token}`, {
        password,
      });

      alert("Account created successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "This invitation link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-white">
        
        {/* Branding/Icon Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-4 animate-bounce-short">
            <FaShieldAlt size={28} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Setup Account</h2>
          <p className="text-slate-500 text-sm font-medium mt-2 text-center">
            Complete your profile to start managing assigned complaints.
          </p>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
              <FaLock className="text-indigo-500" /> New Password
            </label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl
              ${loading 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200"
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
            ) : (
              <>
                <FaUserCheck size={18} />
                Activate Account
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50">
          <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-50 py-3 rounded-2xl border border-amber-100/50">
            <span className="text-[10px] font-black uppercase tracking-widest">
              Security Notice: Link Expires in 24 Hours
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;