import React, { useEffect, useState, useRef, useMemo } from "react";
import API from "../Api";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  FaSignOutAlt, FaTimes, FaToolbox, FaClock, FaChartLine, FaBars,
  FaExclamationTriangle, FaUserCircle, FaHistory, FaChevronDown,
  FaSearch, FaChevronRight, FaCheckCircle, FaSpinner, FaPhone, FaEnvelope, FaBullhorn,
  FaSyncAlt, FaCheckDouble, FaChartPie, FaTachometerAlt
} from "react-icons/fa";

// Helper: Format date to relative time
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

// Helper: Compute weekly resolved data from actual complaints
const computeWeeklyResolvedData = (complaints) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyMap = new Map(days.map(day => [day, 0]));
  
  complaints.filter(c => c.status === 'Resolved').forEach(complaint => {
    const updatedDate = complaint.updatedAt ? new Date(complaint.updatedAt) : new Date(complaint.createdAt);
    const dayIndex = updatedDate.getDay();
    let dayName;
    if (dayIndex === 0) dayName = 'Sun';
    else if (dayIndex === 1) dayName = 'Mon';
    else if (dayIndex === 2) dayName = 'Tue';
    else if (dayIndex === 3) dayName = 'Wed';
    else if (dayIndex === 4) dayName = 'Thu';
    else if (dayIndex === 5) dayName = 'Fri';
    else dayName = 'Sat';
    
    if (weeklyMap.has(dayName)) {
      weeklyMap.set(dayName, weeklyMap.get(dayName) + 1);
    }
  });
  
  return days.map(day => ({ day, resolved: weeklyMap.get(day) || 0 }));
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-500';
  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-right-5 duration-300 ${bgColor}`}>
      {type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
      <span>{message}</span>
    </div>
  );
};

// Skeleton Loader
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-3xl border border-slate-200 p-8">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-200"></div>
      <div className="flex-1">
        <div className="h-3 bg-slate-200 rounded-full w-24 mb-2"></div>
        <div className="h-8 bg-slate-200 rounded-full w-16"></div>
      </div>
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-200"></div><div><div className="h-4 bg-slate-200 rounded w-32 mb-2"></div><div className="h-3 bg-slate-200 rounded w-20"></div></div></div></td>
    <td className="px-8 py-6"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
    <td className="px-8 py-6"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
    <td className="px-8 py-6"><div className="h-8 bg-slate-200 rounded-xl w-20 ml-auto"></div></td>
  </tr>
);

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({ name: "Staff Member", email: "", role: "Technician", avatar: "" });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    
    // Swapped axios.get for API.get and removed the hardcoded localhost prefix
    const res = await API.get("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(res.data);
  } catch (err) { 
    navigate("/login"); 
  }
};

const fetchComplaints = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    
    // Swapped axios.get for API.get and removed the hardcoded localhost prefix
    const res = await API.get("/api/complaints/assigned", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setComplaints(res.data || []);
  } catch (err) {
    console.error("Fetch error", err);
    showToast("Failed to load complaints", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUserProfile();
    fetchComplaints();
    const closeMenu = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

const handleResolve = async () => {
  if (!resolutionNote.trim()) {
    showToast("Please provide resolution notes.", "error");
    return;
  }
  setIsSubmitting(true);
  try {
    const token = localStorage.getItem("token");
    
    // Swapped axios.put for API.put and removed the hardcoded localhost prefix
    await API.put(`/api/complaints/${selectedTask._id}/resolve`,
      {
        resolutionNotes: resolutionNote,
        status: "Resolved"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setSelectedTask(null);
    setResolutionNote("");
    await fetchComplaints();
    showToast("Job completed successfully. Department Manager notified.", "success");
  } catch (err) {
    showToast("Error updating ticket. Please try again.", "error");
  } finally {
    setIsSubmitting(false);
  }
};

  const stats = useMemo(() => ({
    total: complaints.length,
    active: complaints.filter(c => c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.escalated).length,
    completionRate: complaints.length ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100) : 0,
  }), [complaints]);

  const weeklyChartData = useMemo(() => computeWeeklyResolvedData(complaints), [complaints]);

  const filteredTasks = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeSection === "active") return matchesSearch && c.status !== "Resolved";
    if (activeSection === "history") return matchesSearch && c.status === "Resolved";
    if (activeSection === "escalated") return matchesSearch && c.escalated;
    return matchesSearch;
  });

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Water': return { icon: '💧', bg: 'bg-sky-100 text-sky-700', border: 'border-sky-200' };
      case 'Electricity': return { icon: '⚡', bg: 'bg-amber-100 text-amber-700', border: 'border-amber-200' };
      default: return { icon: '🚧', bg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' };
    }
  };

  const getStatusBadge = (status, escalated) => {
    if (escalated) return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1"><FaExclamationTriangle size={8} /> Escalated</span>;
    if (status === 'Resolved') return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200"><FaCheckCircle size={10} className="inline mr-1" /> Resolved</span>;
    return <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200"><FaClock size={10} className="inline mr-1" /> In Progress</span>;
  };

  return (
    <div className="flex min-h-screen font-sans bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-80 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 transform transition-transform duration-300 ease-out shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <FaToolbox className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">FixIt<span className="text-indigo-400">Staff</span></span>
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Field Operations</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition"><FaTimes /></button>
        </div>
        
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-6 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-4">Main Menu</p>
            <SidebarItem icon={<FaTachometerAlt />} label="Overview" active={activeSection === "overview"} onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaClock />} label="Active Jobs" badge={stats.active} active={activeSection === "active"} onClick={() => { setActiveSection("active"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaHistory />} label="History" active={activeSection === "history"} onClick={() => { setActiveSection("history"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaExclamationTriangle />} label="Escalated" badge={stats.escalated} active={activeSection === "escalated"} onClick={() => { setActiveSection("escalated"); setSidebarOpen(false); }} />
          </nav>
          <div className="p-6 border-t border-slate-700/50 mt-auto">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300">
                <FaUserCircle />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white shadow-md"><FaBars /></button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-black tracking-tight text-slate-800">Employee <span className="text-indigo-600">Dashboard</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={fetchComplaints} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors" title="Refresh">
              <FaSyncAlt size={16} />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black shadow-md">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" alt="pfp" /> : user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-700">{user.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</p>
                </div>
                <FaChevronDown className="text-slate-400 text-[10px] hidden sm:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border border-slate-200 bg-white p-2 z-[60] animate-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Employee ID</p>
                    <p className="text-sm font-bold truncate text-slate-700">{user.email || `${user.name}@fixit.com`}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-xs font-black uppercase text-slate-600"><FaUserCircle /> My Account</Link>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 transition-all text-xs font-black uppercase"><FaSignOutAlt /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-8 pb-20">
            
            {/* Announcement Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl shadow-indigo-200 overflow-hidden relative">
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm"><FaBullhorn className="animate-pulse" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Announcement</p>
                  <p className="text-sm font-bold">New safety protocols updated for electrical maintenance. Review now.</p>
                </div>
              </div>
              <FaToolbox className="absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12" />
            </div>

            {/* Stats Grid - with colorful hover effects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
              ) : (
                <>
                  <StatCard 
                    title="Total Assigned" 
                    value={stats.total} 
                    icon={<FaToolbox className="text-indigo-500 text-2xl" />} 
                    trend="+12%" 
                    trendUp 
                    colorScheme="indigo" 
                  />
                  <StatCard 
                    title="Active Jobs" 
                    value={stats.active} 
                    icon={<FaClock className="text-amber-500 text-2xl" />} 
                    trend="-2%" 
                    trendUp={false} 
                    colorScheme="amber" 
                  />
                  <StatCard 
                    title="Resolved" 
                    value={stats.resolved} 
                    icon={<FaCheckDouble className="text-emerald-500 text-2xl" />} 
                    trend={`${stats.completionRate}% rate`} 
                    colorScheme="emerald" 
                  />
                  <StatCard 
                    title="Escalated" 
                    value={stats.escalated} 
                    icon={<FaExclamationTriangle className="text-rose-500 text-2xl" />} 
                    trend="Urgent" 
                    trendUp={false} 
                    colorScheme="rose" 
                  />
                </>
              )}
            </div>

            {/* Charts Section */}
            {activeSection === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Weekly Resolution Trends</h3>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Last 7 days</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="resolved" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32}>
                          {weeklyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#barGradient${index})`} />
                          ))}
                        </Bar>
                        <defs>
                          {weeklyChartData.map((_, idx) => (
                            <linearGradient id={`barGradient${idx}`} key={idx} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                          ))}
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Job Status Distribution</h3>
                    <FaChartPie className="text-slate-400" />
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Active', value: stats.active, color: '#f59e0b' },
                          { name: 'Resolved', value: stats.resolved, color: '#10b981' },
                          { name: 'Escalated', value: stats.escalated, color: '#ef4444' }
                        ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {[{ name: 'Active', value: stats.active, color: '#f59e0b' }, { name: 'Resolved', value: stats.resolved, color: '#10b981' }, { name: 'Escalated', value: stats.escalated, color: '#ef4444' }].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Work Orders Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FaToolbox className="text-indigo-600 text-sm" />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-indigo-600">
                    {activeSection === "active" ? "Active Work Orders" : activeSection === "history" ? "Completed Work Orders" : activeSection === "escalated" ? "Escalated Issues" : "All Work Orders"}
                  </h3>
                </div>
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input 
                    type="text" 
                    placeholder="Search by title or description..." 
                    className="pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white w-full md:w-80 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50/80 border-b border-slate-200">
                      <th className="px-6 py-4 font-black">Issue Details</th>
                      <th className="px-6 py-4 font-black">Assigned On</th>
                      <th className="px-6 py-4 font-black">Status</th>
                      <th className="px-6 py-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => <SkeletonTableRow key={idx} />)
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                            <FaToolbox size={40} className="opacity-30" />
                            <p className="text-sm font-bold">No work orders found</p>
                            <p className="text-xs">Try adjusting your search or filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((ticket) => {
                        const style = getCategoryStyles(ticket.category);
                        const isExpanded = expandedRows[ticket._id];
                        return (
                          <React.Fragment key={ticket._id}>
                            <tr className={`group transition-all duration-200 ${isExpanded ? "bg-indigo-50/30" : "hover:bg-slate-50/50"}`}>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${style.bg} ${style.border} border`}>{style.icon}</div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-800">{ticket.title}</p>
                                    <button onClick={() => toggleRow(ticket._id)} className="text-[9px] font-black text-indigo-500 uppercase flex items-center gap-1 mt-1 hover:text-indigo-700 transition">
                                      {isExpanded ? "Hide Details" : "View Details"} <FaChevronRight size={8} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-xs font-bold text-slate-500">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className="text-[9px] font-medium text-slate-400">{getRelativeTime(ticket.createdAt)}</div>
                              </td>
                              <td className="px-6 py-5">
                                {getStatusBadge(ticket.status, ticket.escalated)}
                              </td>
                              <td className="px-6 py-5 text-right">
                                {ticket.status !== 'Resolved' && !ticket.escalated && (
                                  <button onClick={() => setSelectedTask(ticket)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md">
                                    Resolve
                                  </button>
                                )}
                                {ticket.escalated && ticket.status !== 'Resolved' && (
                                  <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-xl">Awaiting Manager</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/40 border-t border-slate-100">
                                <td colSpan="4" className="px-6 py-6 border-l-[3px] border-indigo-500">
                                  <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                      <h5 className="text-[9px] font-black uppercase text-indigo-500 tracking-wider mb-2">Full Description</h5>
                                      <p className="text-sm font-medium text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-100">{ticket.description}</p>
                                    </div>
                                    <div className="w-full md:w-72 space-y-3">
                                      <h5 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Citizen Contact</h5>
                                      <div className="flex gap-3">
                                        <a href={`tel:${ticket.citizenPhone || "000"}`} className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                                          <FaPhone size={10} /> Call
                                        </a>
                                        <a href={`mailto:${ticket.citizenEmail || "citizen@fixit.com"}`} className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                                          <FaEnvelope size={10} /> Email
                                        </a>
                                      </div>
                                    </div>
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
              {filteredTasks.length > 0 && !loading && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/30 text-right">
                  <p className="text-[9px] font-bold text-slate-400">Showing {filteredTasks.length} of {complaints.length} work orders</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Resolution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-lg rounded-3xl p-8 relative shadow-2xl bg-white animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-all"><FaTimes size={22} /></button>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <FaCheckCircle className="text-emerald-600 text-xl" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Complete Job</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">{selectedTask.title}</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-indigo-500 ml-1 mb-2 block">Resolution Notes <span className="text-rose-500">*</span></label>
                <textarea 
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe the solution provided, parts replaced, or actions taken..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[140px]"
                />
                <p className="text-[9px] text-slate-400 mt-1 ml-2">{resolutionNote.length} characters</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedTask(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition">Cancel</button>
                <button 
                  onClick={handleResolve}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin mx-auto" /> : "Submit Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon, label, active, onClick, badge }) => (
  <div onClick={onClick} className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer text-xs font-black transition-all uppercase tracking-wider group ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-indigo-400"}`}>
    <div className="flex items-center gap-3">
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </div>
    {badge > 0 && (
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${active ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300"}`}>{badge}</span>
    )}
  </div>
);

// *** StatCard with colorful hover effects ***
const StatCard = ({ title, value, icon, trend, trendUp = true, colorScheme = "indigo" }) => {
  // Map colorScheme to Tailwind classes
  const hoverBgClass = {
    indigo: "hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-indigo-100",
    amber: "hover:bg-amber-50 hover:border-amber-200 hover:shadow-amber-100",
    emerald: "hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-emerald-100",
    rose: "hover:bg-rose-50 hover:border-rose-200 hover:shadow-rose-100",
  }[colorScheme];

  const iconHoverClass = {
    indigo: "group-hover:text-indigo-600 group-hover:scale-110",
    amber: "group-hover:text-amber-600 group-hover:scale-110",
    emerald: "group-hover:text-emerald-600 group-hover:scale-110",
    rose: "group-hover:text-rose-600 group-hover:scale-110",
  }[colorScheme];

  return (
    <div className={`group bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-300 hover:-translate-y-1 ${hoverBgClass} hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`text-slate-700 transition-all duration-300 ${iconHoverClass}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h4>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-1">{title}</p>
    </div>
  );
};

export default EmployeeDashboard;