import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, FaLock, FaBell, FaShieldAlt, FaCamera, FaSpinner, 
  FaCheck, FaExclamationTriangle, FaSignOutAlt, FaArrowLeft, 
  FaEnvelope, FaGlobe, FaBuilding, FaTimes, FaEye
} from "react-icons/fa";

const Profile = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Form States
  const [generalForm, setGeneralForm] = useState({ name: "", email: "", department: "Engineering", location: "New York, USA" });
  const [securityForm, setSecurityForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifPreferences, setNotifPreferences] = useState({ email: true, push: false, monthlyReport: true });
  
  // Avatar State
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // --- API LOGIC ---
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      
      const res = await axios.get("https://backend-ml27.onrender.com/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      setGeneralForm({ 
        name: res.data.name || "", 
        email: res.data.email || "", 
        department: res.data.role || "General", 
        location: res.data.location || "Remote" 
      });
      setAvatarPreview(res.data.avatar);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      let base64Image = avatarPreview;

      if (avatarFile) {
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(avatarFile);
        });
      }

      const payload = { ...generalForm, avatar: base64Image };
      
      const res = await axios.put("https://backend-ml27.onrender.com/api/update", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      alert("Profile updated successfully.");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm("Remove profile picture? This will revert to your initials.")) {
        setAvatarPreview(null);
        setAvatarFile(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // --- RENDER HELPERS ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600"><FaSpinner className="animate-spin text-3xl" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120] font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      
      {/* 1. SETTINGS SIDEBAR (Context Navigation) */}
      <aside className="w-full md:w-80 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-8 transition-colors uppercase tracking-wider">
            <FaArrowLeft /> Back to Dashboard
          </button>
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative group mb-4">
              {/* Avatar Container with View Overlay */}
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ring-4 ring-white dark:ring-[#111827] shadow-lg relative">
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="User" className="w-full h-full object-cover" />
                    <div 
                        onClick={() => setShowViewModal(true)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <FaEye className="text-white text-lg" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300">
                    {user?.name?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Action Buttons: Camera & Remove */}
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <label className="p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-500 shadow-md transition-all hover:scale-110">
                    <FaCamera size={10} />
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                    }
                    }} />
                </label>
                {avatarPreview && (
                    <button 
                        onClick={handleRemoveAvatar}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md transition-all hover:scale-110"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{user?.name}</h2>
            <p className="text-xs font-medium text-slate-500">{user?.email}</p>
            <span className="mt-3 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-800">
              {user?.role || "Staff Member"}
            </span>
          </div>

          <nav className="space-y-1">
            <SettingsTab active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<FaUser />} label="General Profile" desc="Personal details & photo" />
            <SettingsTab active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<FaShieldAlt />} label="Security & Login" desc="Password, 2FA, Sessions" />
            <SettingsTab active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<FaBell />} label="Notifications" desc="Email & Push alerts" />
          </nav>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors">
            <FaSignOutAlt /> Sign Out Securely
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
            <p className="text-slate-500 mt-2 text-sm">Manage your profile information and system preferences.</p>
          </div>

          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionCard title="Public Identity" description="This information will be displayed publicly on your team profile.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Display Name" value={generalForm.name} onChange={(e) => setGeneralForm({...generalForm, name: e.target.value})} icon={<FaUser />} />
                  <InputGroup label="Job Title / Role" value={generalForm.department} disabled icon={<FaBuilding />} />
                  <InputGroup label="Location" value={generalForm.location} onChange={(e) => setGeneralForm({...generalForm, location: e.target.value})} icon={<FaGlobe />} />
                </div>
              </SectionCard>

              <SectionCard title="Contact Information" description="Private contact details used for notifications and billing.">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Email Address" value={generalForm.email} onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})} icon={<FaEnvelope />} />
                 </div>
              </SectionCard>

              <div className="flex justify-end pt-4">
                <button onClick={handleSaveGeneral} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionCard title="Password Update" description="Ensure your account is using a long, random password to stay secure.">
                <div className="max-w-md space-y-4">
                  <InputGroup type="password" label="Current Password" placeholder="••••••••" />
                  <InputGroup type="password" label="New Password" placeholder="••••••••" />
                  <InputGroup type="password" label="Confirm New Password" placeholder="••••••••" />
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="text-indigo-600 font-bold text-sm hover:underline">Update Password</button>
                </div>
              </SectionCard>
              
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-red-100 dark:border-red-900/30 p-8">
                 <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2"><FaExclamationTriangle /> Danger Zone</h3>
                 <p className="text-slate-500 text-sm mb-6">Permanently delete your account and all of your content.</p>
                 <button className="bg-red-50 text-red-600 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest border border-red-200 hover:bg-red-100 transition-colors">Delete Account</button>
              </div>
            </div>
          )}

           {/* TAB: NOTIFICATIONS */}
           {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionCard title="Email Preferences" description="Control which emails you receive from the system.">
                <div className="space-y-4">
                   <ToggleSwitch label="Security Alerts" desc="Get notified about logins from new devices." checked={notifPreferences.email} onChange={() => setNotifPreferences({...notifPreferences, email: !notifPreferences.email})} />
                   <ToggleSwitch label="Monthly Reports" desc="Receive a summary of your tasks every month." checked={notifPreferences.monthlyReport} onChange={() => setNotifPreferences({...notifPreferences, monthlyReport: !notifPreferences.monthlyReport})} />
                   <ToggleSwitch label="Direct Mentions" desc="Email me when someone mentions me in a comment." checked={true} />
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </main>

      {/* 3. MEDIUM LIGHTBOX MODAL */}
      {showViewModal && avatarPreview && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setShowViewModal(false)}
        >
          {/* Container sized to max-w-md (Medium) */}
          <div 
            className="relative max-w-md w-full bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowViewModal(false)}
              className="absolute -top-4 -right-4 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-all z-10"
            >
              <FaTimes size={16} />
            </button>
            
            <div className="overflow-hidden rounded-[2.2rem]">
                <img 
                src={avatarPreview} 
                alt="Profile Large" 
                className="w-full aspect-square object-cover" 
                />
            </div>
            
            <div className="p-6 text-center">
                <h4 className="text-slate-900 dark:text-white font-black text-xl tracking-tight">{user?.name}</h4>
                <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{user?.role || 'Staff Member'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS FOR CONSISTENCY ---

const SettingsTab = ({ active, onClick, icon, label, desc }) => (
  <button onClick={onClick} className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200 text-left group ${active ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
    <div className={`mt-1 text-lg ${active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}>{icon}</div>
    <div>
      <p className={`text-sm font-bold ${active ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-200"}`}>{label}</p>
      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{desc}</p>
    </div>
  </button>
);

const SectionCard = ({ title, description, children }) => (
  <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111827]">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const InputGroup = ({ label, icon, type = "text", ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input 
        type={type} 
        {...props} 
        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all ${icon ? "pl-11 pr-4" : "px-4"}`} 
      />
    </div>
  </div>
);

const ToggleSwitch = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <button onClick={onChange} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
    </button>
  </div>
);

export default Profile;