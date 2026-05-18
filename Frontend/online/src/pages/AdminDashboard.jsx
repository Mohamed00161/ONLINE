import React, { useEffect, useState, useMemo, useRef } from "react";
import API from  "../Api.js"
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  FaHome, FaUserShield, FaBuilding, FaChartLine, FaExclamationTriangle,
  FaCheckDouble, FaSignOutAlt, FaSun, FaMoon, FaUserPlus, FaEnvelope,
  FaUsers, FaFileAlt, FaSearch, FaArrowRight, FaUserCircle, FaChevronDown,
  FaCog, FaTimes, FaClock, FaFilter, FaCalendarAlt, FaSpinner, FaBell,
  FaBars,
  FaChevronRight,   // add this
  FaQuoteLeft,      // add this
  FaCheckCircle     // add this
} from "react-icons/fa";

// --- Toast Notification Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-500';
  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-right-5 duration-300 ${bgColor}`}>
      {type === 'success' ? <FaCheckDouble /> : <FaExclamationTriangle />}
      <span>{message}</span>
    </div>
  );
};

// --- Skeleton Loaders ---
const StatSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
    </div>
    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-4 p-8">
    {[1,2,3].map(i => (
      <div key={i} className="flex items-center gap-6">
        <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    ))}
  </div>
);

// --- Helper: format date range ---
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();
  if (range === 'today') start.setHours(0,0,0,0);
  else if (range === 'week') start.setDate(now.getDate() - 7);
  else if (range === 'month') start.setMonth(now.getMonth() - 1);
  else start.setDate(now.getDate() - 30); // default 30 days
  return { start, end: now };
};

const AdminDashboard = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [manager, setManager] = useState({ name: "", avatar: "", role: "admin" });

  // --- State ---
  const [complaints, setComplaints] = useState([]);
  const [reports, setReports] = useState([]);
  const [managers, setManagers] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: "" });
  const [isInviting, setIsInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("week");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);
  const [resendingId, setResendingId] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const [expandedRows, setExpandedRows] = useState({});
const toggleRow = (id) => {
  setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
};

  // --- Data Fetching ---
const fetchGlobalData = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    // Using API instead of axios automatically uses your Render URL on production!
    const [complaintsRes, reportsRes, managersRes] = await Promise.all([
      API.get("/api/complaints/all", config),
      API.get("/api/complaints/Report", config),
      API.get("/api/admin/managers", config)
    ]);

    // Your existing code to handle the responses goes here...

  } catch (error) {
    console.error("Error fetching global data:", error);
  } finally {
    setLoading(false);
  }
};
  

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 60000);
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleInviteManager = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.department) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setIsInviting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/admin/invite-manager", inviteForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Invitation sent successfully!");
      setInviteForm({ name: "", email: "", department: "" });
      setShowInviteModal(false);
      fetchGlobalData();
    } catch (err) {
      showToast(err.response?.data?.message || "Invitation failed", "error");
    } finally {
      setIsInviting(false);
    }
  };

const handleResendInvite = async (manager) => {
  setResendingId(manager._id); // Start loading for this specific row
  
  try {
    const token = localStorage.getItem("token");
    
    // Updated URL to match your backend: /api/admin/employees/:id/resend
    const res = await API.post("/api/admin/employees/${manager._id}/resend", 
      {}, // Empty body because we use URL params
      { headers: { Authorization: `Bearer ${token}` } }
    );

    showToast(`Activation link resent to ${manager.email}`, "success");
  } catch (err) {
    // Catch the Mailtrap 429 "Too many emails" or 404 "Not found"
    showToast(err.response?.data?.message || "Failed to resend link.", "error");
  } finally {
    setResendingId(null); // Stop loading
  }
};
  const handleRouteToDept = async (complaintId, deptName) => {
    const formattedDept = deptName.charAt(0).toUpperCase() + deptName.slice(1);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/complaints/${complaintId}/assign-dept",
        { department: formattedDept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Routed to ${formattedDept}`);
      fetchGlobalData();
    } catch (err) {
      showToast("Routing failed", "error");
    }
  };

  // --- Statistics & Charts Data ---
  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    resolved: complaints.filter(c => c.status === "Resolved" || c.status === "Completed").length,
    reportCount: reports.length,
    resolutionRate: complaints.length ? Math.round((complaints.filter(c => c.status === "Resolved").length / complaints.length) * 100) : 0,
  }), [complaints, reports]);

  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);
    complaints.forEach(c => {
      const date = new Date(c.createdAt);
      const dayIndex = date.getDay();
      const mapped = dayIndex === 0 ? 6 : dayIndex - 1;
      counts[mapped]++;
    });
    return days.map((day, idx) => ({ day, complaints: counts[idx] }));
  }, [complaints]);

  const deptDistribution = useMemo(() => {
    const deptMap = new Map();
    complaints.forEach(c => {
      const dept = c.department || "Unassigned";
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    return Array.from(deptMap.entries()).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase()) && !c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    const { start } = getDateRange(dateRange);
    const complaintDate = new Date(c.createdAt);
    if (complaintDate < start) return false;
    return true;
  });

  const recentActivity = complaints.filter(c => c.status === "Resolved").slice(0, 5);

  return (
    <div className={`flex h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-80 bg-slate-900 flex flex-col border-r border-white/5 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <FaUserShield size={20} />
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tighter uppercase">FixIt <span className="text-indigo-400">Admin</span></span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Control Center</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><FaTimes /></button>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <SidebarLink icon={<FaHome />} label="Overview" active={activeSection === "overview"} onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} />
          <SidebarLink icon={<FaBuilding />} label="Dispatch" active={activeSection === "dispatch"} onClick={() => { setActiveSection("dispatch"); setSidebarOpen(false); }} />
          <SidebarLink icon={<FaFileAlt />} label="Live Reports" active={activeSection === "reports"} onClick={() => { setActiveSection("reports"); setSidebarOpen(false); }} />
          <SidebarLink icon={<FaUsers />} label="Manager Setup" active={activeSection === "managers"} onClick={() => { setActiveSection("managers"); setSidebarOpen(false); }} />
        </nav>
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300">
              <FaUserCircle />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{admin?.name || "Admin"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 px-6 lg:px-10 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white"><FaBars /></button>
            <div>
              <h2 className="text-xl font-black capitalize tracking-tight">{activeSection.replace("-", " ")}</h2>
              <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Global Administrative Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition">
              {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-600" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md overflow-hidden">
                  {admin?.avatar ? <img src={admin.avatar} className="w-full h-full object-cover" /> : admin?.name?.charAt(0) || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold">{admin?.name || "Admin"}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Authorized</p>
                </div>
                <FaChevronDown size={10} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50">
                  <button onClick={() => navigate("/profile")} className="w-full flex items-center gap-3 p-4 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"><FaUserCircle /> My Profile</button>
                  <button className="w-full flex items-center gap-3 p-4 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"><FaCog /> Settings</button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><FaSignOutAlt /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar">
          {/* OVERVIEW SECTION */}
          {activeSection === "overview" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-3xl lg:text-4xl font-black tracking-tighter">Welcome back, Admin</h3>
                  <p className="text-indigo-100 font-medium mt-2">System is running optimally. You have {stats.pending} pending dispatches.</p>
                  <div className="mt-6 flex gap-4">
                    <button onClick={() => setActiveSection("dispatch")} className="bg-white/20 backdrop-blur-sm px-5 py-2 rounded-xl text-xs font-black uppercase hover:bg-white/30 transition">Go to Dispatch</button>
                  </div>
                </div>
                <FaUserShield className="absolute -right-10 -bottom-10 text-[12rem] text-white/10 rotate-12" />
              </div>

              {/* Stats Grid with colorful icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                  <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
                ) : (
                  <>
                    <StatCard title="Total Inquiries" value={stats.total} icon={<FaChartLine />} colorScheme="indigo" trend="+8%" />
                    <StatCard title="Pending Dispatch" value={stats.pending} icon={<FaClock />} colorScheme="amber" trend="Critical" trendUp={false} />
                    <StatCard title="Resolved Cases" value={stats.resolved} icon={<FaCheckDouble />} colorScheme="emerald" trend={`${stats.resolutionRate}% rate`} />
                    <StatCard title="Field Reports" value={stats.reportCount} icon={<FaFileAlt />} colorScheme="purple" trend="+12" />
                  </>
                )}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600">Weekly Complaint Trend</h3>
                    <FaChartLine className="text-slate-400" />
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="complaints" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600">Department Distribution</h3>
                    <FaBuilding className="text-slate-400" />
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {deptDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#fff" />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600">Recent Activity</h3>
                  <FaBell className="text-slate-400" />
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {recentActivity.length > 0 ? recentActivity.map(activity => (
                    <div key={activity._id} className="p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                        <FaCheckDouble />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{activity.title}</p>
                        <p className="text-[10px] text-slate-400">Resolved by {activity.assignedEmployee?.name || "Technician"}</p>
                      </div>
                      <p className="text-[9px] font-black text-slate-400">{new Date(activity.updatedAt).toLocaleDateString()}</p>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-slate-400 italic">No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DISPATCH SECTION */}
{activeSection === "dispatch" && (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Filter Bar - Enhanced */}
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div>
        <h3 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">Complaint Dispatch</h3>
        <p className="text-xs text-slate-500 mt-1">Route complaints to the appropriate department</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input 
            type="text" 
            placeholder="Search by title, email or description..." 
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <select 
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select 
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 cursor-pointer" 
          value={dateRange} 
          onChange={e => setDateRange(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>
    </div>

    {/* Complaints Table with Expandable Description */}
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 border-b dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Issue Details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Route to Department</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {loading ? (
              <TableSkeleton />
            ) : filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <FaSearch size={40} className="opacity-30" />
                    <p className="font-black text-sm uppercase tracking-wider">No complaints match your filters</p>
                    <button onClick={() => { setSearchTerm(""); setFilterStatus("all"); setDateRange("week"); }} className="text-indigo-500 text-xs font-bold underline">Clear filters</button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredComplaints.map((c, idx) => {
                const isExpanded = expandedRows[c._id];
                return (
                  <React.Fragment key={c._id}>
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200">
                      <td className="px-6 py-5">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <FaEnvelope className="text-[10px]" /> {c.userEmail}
                        </p>
                        <button
                          onClick={() => toggleRow(c._id)}
                          className="text-[9px] font-black text-indigo-500 mt-1.5 flex items-center gap-1 hover:text-indigo-600 transition"
                        >
                          {isExpanded ? <FaTimes size={10} /> : <FaChevronRight size={10} />}
                          {isExpanded ? "Hide Description" : "View Description"}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          {c.category === "Water" ? "💧" : c.category === "Electricity" ? "⚡" : "🔧"} {c.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-full border ${
                          c.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30' 
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {c.status === "Pending" ? (
                          <div className="flex flex-wrap gap-2">
                            {["Water", "Electricity", "Waste", "Roads"].map(dept => (
                              <button
                                key={dept}
                                onClick={() => handleRouteToDept(c._id, dept)}
                                className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                              >
                                {dept}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic flex items-center gap-1">
                            <FaCheckCircle className="text-emerald-500" /> Routed
                          </span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <td colSpan="4" className="px-6 py-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <FaQuoteLeft className="text-indigo-400 text-lg mt-0.5" />
                              <div className="flex-1">
                                <h5 className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-1">Full Description</h5>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {c.description || "No description provided."}
                                </p>
                              </div>
                            </div>
                            {c.resolutionNotes && (
                              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-3">
                                  <FaCheckCircle className="text-emerald-500 text-lg mt-0.5" />
                                  <div className="flex-1">
                                    <h5 className="text-[10px] font-black uppercase text-emerald-500 tracking-wider mb-1">Resolution Notes (if any)</h5>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                      "{c.resolutionNotes}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - with expandable description */}
      <div className="md:hidden divide-y dark:divide-slate-800">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                <div className="h-6 bg-slate-200 rounded-full w-16"></div>
              </div>
            </div>
          ))
        ) : filteredComplaints.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No complaints found</div>
        ) : (
          filteredComplaints.map(c => {
            const isExpanded = expandedRows[c._id];
            return (
              <div key={c._id} className="p-5 space-y-3 border-b dark:border-slate-800 last:border-0">
                <div>
                  <h4 className="font-black text-base">{c.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{c.userEmail}</p>
                  <button
                    onClick={() => toggleRow(c._id)}
                    className="text-[9px] font-black text-indigo-500 mt-1.5 flex items-center gap-1"
                  >
                    {isExpanded ? <FaTimes size={10} /> : <FaChevronRight size={10} />}
                    {isExpanded ? "Hide Description" : "View Description"}
                  </button>
                </div>
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-black">Description:</span> {c.description || "No description provided"}
                    </p>
                    {c.resolutionNotes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        <span className="font-black text-emerald-500">Resolution:</span> "{c.resolutionNotes}"
                      </p>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                    {c.category}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${
                    c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "Pending" ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Water", "Electricity", "Waste", "Roads"].map(dept => (
                      <button
                        key={dept}
                        onClick={() => handleRouteToDept(c._id, dept)}
                        className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic flex items-center gap-1"><FaCheckCircle /> Already routed</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
)}
          {/* REPORTS SECTION */}
          {activeSection === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div><h3 className="text-2xl font-black tracking-tighter">Intelligence Feed</h3><p className="text-xs text-slate-500">Validated field reports from personnel</p></div>
                <div className="bg-indigo-500/10 text-indigo-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase">Live Sync</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-5 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="relative max-w-sm"><FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search reports..." className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full text-sm" onChange={e => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {loading ? <TableSkeleton /> : complaints.filter(c => c.status === "Resolved" && c.resolutionNotes).filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(report => (
                    <div key={report._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition group">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-4 min-w-[200px]"><div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500">{report.assignedEmployee?.name?.charAt(0) || "T"}</div><div><h4 className="font-black text-sm">{report.assignedEmployee?.name || "Technician"}</h4><p className="text-[10px] text-slate-400 uppercase">{report.department} Unit</p></div></div>
                        <div className="flex-1"><p className="text-xs font-bold text-indigo-500 mb-1">Issue Resolved</p><p className="text-sm text-slate-600 dark:text-slate-300 italic">"{report.resolutionNotes}"</p></div>
                        <div className="text-right"><p className="text-[9px] font-black text-slate-400">{new Date(report.updatedAt).toLocaleDateString()}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MANAGER SETUP SECTION */}
     {activeSection === "managers" && (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row justify-between gap-4">
      <div>
        <h3 className="text-2xl font-black tracking-tighter">Manager Access Control</h3>
        <p className="text-xs text-slate-500">Invite and manage department managers</p>
      </div>
      <button 
        onClick={() => setShowInviteModal(true)} 
        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
      >
        <FaUserPlus /> Invite New Manager
      </button>
    </div>

    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-5 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="relative max-w-sm">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search managers..." 
            className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full text-sm" 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="divide-y dark:divide-slate-800">
        {loading ? (
          <TableSkeleton />
        ) : (
          managers
            .filter(m => 
              m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              m.email.includes(searchTerm)
            )
            .map(m => (
              <div key={m._id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-600 text-lg">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black">{m.name}</h4>
                    <p className="text-[9px] text-slate-400 uppercase">{m.department} Dept</p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* The Status Badge */}
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {m.status || "Pending"}
                  </span>

                  {/* The Improved Resend Button */}
                  {m.status !== 'Active' && (
                    <button 
                      onClick={() => handleResendInvite(m)} 
                      disabled={resendingId === m._id}
                      className={`text-[10px] font-black px-4 py-2 rounded-xl transition flex items-center gap-2 
                        ${resendingId === m._id 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                        }`}
                    >
                      {resendingId === m._id ? (
                        <div className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      ) : (
                        <FaEnvelope />
                      )}
                      {resendingId === m._id ? "Sending..." : "Resend"}
                    </button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  </div>
)}
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowInviteModal(false)}>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-6 text-white relative"><h3 className="text-xl font-black">Invite Manager</h3><button onClick={() => setShowInviteModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white"><FaTimes /></button></div>
            <form onSubmit={handleInviteManager} className="p-6 space-y-4">
              <input type="text" placeholder="Full Name" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border focus:border-indigo-500 outline-none" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} required />
              <input type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border focus:border-indigo-500 outline-none" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} required />
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border focus:border-indigo-500 outline-none" value={inviteForm.department} onChange={e => setInviteForm({...inviteForm, department: e.target.value})} required>
                <option value="">Select Department</option>
                {["Water","Electricity","Waste","Roads"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button type="submit" disabled={isInviting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center items-center gap-2">{isInviting ? <FaSpinner className="animate-spin" /> : "Send Invitation"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Reusable Components ---
const SidebarLink = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold text-sm ${active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
    <span className="text-lg">{icon}</span> {label}
  </button>
);

// *** UPDATED StatCard with colorful default icons ***
const StatCard = ({ title, value, icon, colorScheme = "indigo", trend, trendUp = true }) => {
  // Map colorScheme to icon default color and hover color
  const iconColorClass = {
    indigo: "text-indigo-500 group-hover:text-indigo-600",
    amber: "text-amber-500 group-hover:text-amber-600",
    emerald: "text-emerald-500 group-hover:text-emerald-600",
    purple: "text-purple-500 group-hover:text-purple-600",
  }[colorScheme];

  const hoverBgClass = {
    indigo: "hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-500/30",
    amber: "hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-500/10 dark:hover:border-amber-500/30",
    emerald: "hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30",
    purple: "hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-500/10 dark:hover:border-purple-500/30",
  }[colorScheme];

  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 ${hoverBgClass} hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`transition-all duration-300 scale-100 group-hover:scale-110 ${iconColorClass}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-black dark:text-white">{value}</p>
      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-1">{title}</p>
    </div>
  );
};

export default AdminDashboard;