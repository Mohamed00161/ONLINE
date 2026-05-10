import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { 
  FaUser, FaLock, FaBell, FaShieldAlt, FaCamera, FaSpinner, 
  FaCheck, FaExclamationTriangle, FaSignOutAlt, FaArrowLeft, 
  FaEnvelope, FaGlobe, FaBuilding, FaTimes, FaEye, FaEyeSlash,
  FaDesktop, FaMobileAlt, FaSave, FaSyncAlt
} from "react-icons/fa";

// --- Toast Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-500';
  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-right-5 duration-300 ${bgColor}`}>
      {type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
      <span>{message}</span>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [generalForm, setGeneralForm] = useState({ name: "", email: "", department: "", location: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState({ emailAlerts: true, pushAlerts: true, smsAlerts: false });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
    const res = await axios.get("http://localhost:5000/api/auth/profile", { // Added /auth
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
      setUser(res.data);
      setGeneralForm({ 
        name: res.data.name || "", 
        email: res.data.email || "", 
        department: res.data.role || res.data.department || "Citizen", 
        location: res.data.location || "Not specified" 
      });
      setAvatarPreview(res.data.avatar);
      // Load notification preferences if available
      if (res.data.notifications) setNotifications(res.data.notifications);
    } catch (err) { 
      if (err.response?.status === 401) navigate("/login"); 
      showToast("Failed to load profile", "error");
    } finally { 
      setLoading(false); 
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await axios.put("http://localhost:5000/api/update", generalForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setSaveSuccess(true);
      showToast("Profile updated successfully");
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchProfile(); // refresh user data
    } catch (err) { 
      showToast("Error saving profile", "error"); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    
    try {
      const res = await axios.post("http://localhost:5000/api/upload-avatar", formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setUser({ ...user, avatar: res.data.avatar });
      showToast("Avatar updated successfully");
    } catch (err) {
      showToast("Avatar upload failed", "error");
      // revert preview
      setAvatarPreview(user?.avatar);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setSaving(true);
    try {
      await axios.post("http://localhost:5000/api/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      showToast("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setSaving(true);
    try {
      await axios.put("http://localhost:5000/api/notifications", notifications, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      showToast("Notification preferences saved");
    } catch (err) {
      showToast("Failed to save preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (window.confirm("Revoke this session? You will be logged out from that device.")) {
      try {
        await axios.post(`http://localhost:5000/api/revoke-session/${sessionId}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        showToast("Session revoked");
        fetchProfile(); // refresh sessions
      } catch (err) {
        showToast("Failed to revoke session", "error");
      }
    }
  };

  // Calculate profile strength
  const calculateStrength = () => {
    let score = 0;
    if (user?.name && user.name.length > 2) score += 20;
    if (user?.email && user.email.includes("@")) score += 20;
    if (user?.location && user.location !== "Not specified") score += 20;
    if (user?.avatar) score += 20;
    if (user?.phone) score += 20;
    return score;
  };
  const strength = calculateStrength();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
    </div>
  );

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR */}
          <aside className="w-full lg:w-96 space-y-6">
            <div className={`rounded-3xl p-8 border shadow-sm transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <button onClick={() => navigate(-1)} className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2">
                <FaArrowLeft /> Back
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800 shadow-xl relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-4xl font-black">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <label className={`absolute -bottom-2 -right-2 p-2.5 rounded-xl cursor-pointer shadow-lg transition-all hover:scale-110 ${darkMode ? "bg-indigo-600 hover:bg-indigo-500" : "bg-indigo-600 hover:bg-indigo-700"} text-white`}>
                    {uploadingAvatar ? <FaSpinner className="animate-spin" size={14} /> : <FaCamera size={14} />}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden disabled={uploadingAvatar} />
                  </label>
                </div>

                <h2 className="text-2xl font-black tracking-tight">{user?.name}</h2>
                <p className="text-sm font-bold text-slate-400 mt-1">{user?.role || "Citizen"}</p>
                <p className="text-xs text-slate-500 mt-1">{user?.email}</p>

                <nav className="w-full mt-8 space-y-2">
                  <SideTab active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<FaUser />} label="General" darkMode={darkMode} />
                  <SideTab active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<FaShieldAlt />} label="Security" darkMode={darkMode} />
                  <SideTab active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<FaBell />} label="Notifications" darkMode={darkMode} />
                  <SideTab active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} icon={<FaDesktop />} label="Active Sessions" darkMode={darkMode} />
                </nav>
              </div>
            </div>

            {/* Profile Strength Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Profile Strength</span>
                <span className="text-xl font-black">{strength}%</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${strength}%` }} />
              </div>
              <p className="text-[11px] font-medium leading-relaxed opacity-90">
                {strength < 100 ? "Complete your profile (add location, avatar) to reach 100%." : "Perfect! Your profile is complete."}
              </p>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <main className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter mb-2">Account Settings</h1>
              <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Manage your personal information, security, and preferences.</p>
            </div>

            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className={`px-8 py-6 border-b ${darkMode ? "border-slate-800" : "border-slate-100"} ${darkMode ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                    <h3 className="text-lg font-black tracking-tight">Personal Information</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Publicly visible within your organization</p>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      <InputGroup label="Full Name" value={generalForm.name} onChange={(e) => setGeneralForm({...generalForm, name: e.target.value})} icon={<FaUser />} darkMode={darkMode} />
                      <InputGroup label="Role" value={generalForm.department} disabled icon={<FaBuilding />} darkMode={darkMode} />
                      <InputGroup label="Location" value={generalForm.location} onChange={(e) => setGeneralForm({...generalForm, location: e.target.value})} icon={<FaGlobe />} darkMode={darkMode} />
                      <InputGroup label="Email" value={generalForm.email} onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})} icon={<FaEnvelope />} darkMode={darkMode} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveGeneral} 
                    disabled={saving || saveSuccess}
                    className={`min-w-[180px] h-12 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md ${
                      saveSuccess ? 'bg-emerald-500 text-white' : 
                      `${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`
                    }`}
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : saveSuccess ? <FaCheck /> : <FaSave />}
                    {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className={`px-8 py-6 border-b ${darkMode ? "border-slate-800" : "border-slate-100"} ${darkMode ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                    <h3 className="text-lg font-black tracking-tight">Change Password</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update your login credentials</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="relative">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Current Password</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          className={`w-full rounded-2xl py-3.5 px-5 pr-12 text-sm font-bold outline-none transition-all border-2 ${darkMode ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900"}`}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showCurrentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block ${darkMode ? "text-slate-400" : "text-slate-500"}`}>New Password</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          className={`w-full rounded-2xl py-3.5 px-5 pr-12 text-sm font-bold outline-none transition-all border-2 ${darkMode ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900"}`}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Confirm New Password</label>
                      <input 
                        type="password" 
                        className={`w-full rounded-2xl py-3.5 px-5 text-sm font-bold outline-none transition-all border-2 ${darkMode ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900"}`}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleChangePassword} 
                      disabled={saving}
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                      {saving ? <FaSpinner className="animate-spin" /> : <FaLock />}
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className={`rounded-3xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`px-8 py-6 border-b ${darkMode ? "border-slate-800" : "border-slate-100"} ${darkMode ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                  <h3 className="text-lg font-black tracking-tight">Notification Preferences</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Choose how you want to be alerted</p>
                </div>
                <div className="p-8 space-y-6">
                  <NotificationItem label="Email Alerts" description="Receive updates about your complaints via email" enabled={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} darkMode={darkMode} />
                  <NotificationItem label="Push Notifications" description="Real-time browser notifications" enabled={notifications.pushAlerts} onChange={() => setNotifications({...notifications, pushAlerts: !notifications.pushAlerts})} darkMode={darkMode} />
                  <NotificationItem label="SMS Alerts" description="Text message for urgent updates" enabled={notifications.smsAlerts} onChange={() => setNotifications({...notifications, smsAlerts: !notifications.smsAlerts})} darkMode={darkMode} />
                  <button onClick={handleUpdateNotifications} disabled={saving} className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition shadow-md flex items-center gap-2">
                    {saving ? <FaSpinner className="animate-spin" /> : <FaBell />}
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE SESSIONS TAB */}
            {activeTab === "sessions" && (
              <div className={`rounded-3xl border shadow-sm overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className={`px-8 py-6 border-b ${darkMode ? "border-slate-800" : "border-slate-100"} ${darkMode ? "bg-slate-800/30" : "bg-slate-50/50"}`}>
                  <h3 className="text-lg font-black tracking-tight">Active Sessions</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Devices currently logged into this account</p>
                </div>
                <div className="p-8 space-y-4">
                  {/* Example sessions – replace with actual data from backend */}
                  <SessionItem device="MacBook Pro - Chrome" location="London, UK" active={true} icon={<FaDesktop />} onRevoke={() => handleRevokeSession("session1")} darkMode={darkMode} />
                  <SessionItem device="iPhone 15 Pro - Safari" location="London, UK" active={false} icon={<FaMobileAlt />} onRevoke={() => handleRevokeSession("session2")} darkMode={darkMode} />
                  <SessionItem device="Work Station - Brave" location="Manchester, UK" active={false} icon={<FaDesktop />} onRevoke={() => handleRevokeSession("session3")} darkMode={darkMode} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---
const SideTab = ({ active, onClick, icon, label, darkMode }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-wider ${active ? "bg-indigo-600 text-white shadow-lg" : `${darkMode ? "text-slate-400 hover:bg-slate-800 hover:text-indigo-400" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"}`}`}>
    <span className="text-lg">{icon}</span> {label}
  </button>
);

const InputGroup = ({ label, icon, darkMode, ...props }) => (
  <div className="space-y-2 group">
    <label className={`text-[10px] font-black uppercase tracking-wider ml-1 group-focus-within:text-indigo-600 transition-colors ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</label>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-500" : "text-slate-400"} group-focus-within:text-indigo-500 transition-colors`}>{icon}</div>
      <input {...props} className={`w-full rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold outline-none transition-all border-2 ${darkMode ? "bg-slate-800 border-slate-700 focus:border-indigo-500 text-white" : "bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900"} ${props.disabled ? "opacity-60 cursor-not-allowed" : ""}`} />
    </div>
  </div>
);

const NotificationItem = ({ label, description, enabled, onChange, darkMode }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl border transition-colors cursor-pointer hover:bg-opacity-20" onClick={onChange}>
    <div>
      <p className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-800"}`}>{label}</p>
      <p className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
    </div>
    <div className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-7" : "translate-x-1"}`} />
    </div>
  </div>
);

const SessionItem = ({ device, location, active, icon, onRevoke, darkMode }) => (
  <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${darkMode ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? "bg-slate-700 text-slate-400" : "bg-white text-slate-500"} shadow-sm`}>{icon}</div>
      <div>
        <p className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-800"}`}>{device}</p>
        <p className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{location} • {active ? <span className="text-emerald-500">Active Now</span> : '2 hours ago'}</p>
      </div>
    </div>
    <button onClick={onRevoke} className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all ${darkMode ? "text-slate-400 hover:bg-red-500/20 hover:text-red-400" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}>
      Revoke
    </button>
  </div>
);

export default Profile;