import React, { useEffect, useState, useRef } from "react";
import API from "../Api.js";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

// --- MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICON IMPORTS ---
import {
  FaTicketAlt, FaPlus, FaSignOutAlt, FaHistory, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaSearch, FaTrashAlt, FaCalendarAlt, FaChevronRight, 
  FaTimes, FaUserCircle, FaMapMarkedAlt, FaBullhorn, FaPhoneAlt, FaQuoteLeft,
  FaBars, FaChevronDown, FaChartLine, FaFileExport, FaFilter, FaSpinner,
  FaSun, FaMoon
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import SubmitComplaint from './ComplaintForm.jsx';

// Fix for Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Toast Component ---
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

// --- Skeleton Loaders ---
const StatSkeleton = () => (
  <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
      <div className="flex-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <tbody>
    {[1,2,3].map(i => (
      <tr key={i} className="animate-pulse">
        <td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700"></div><div><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></div></div></td>
        <td className="px-8 py-6"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
        <td className="px-8 py-6"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div></td>
        <td className="px-8 py-6"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-10 ml-auto"></div></td>
      </tr>
    ))}
  </tbody>
);

// --- Helper: compute weekly resolved data ---
const computeWeeklyResolved = (complaints) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = new Array(7).fill(0);
  complaints.filter(c => c.status === 'Resolved').forEach(c => {
    const date = new Date(c.updatedAt);
    const dayIndex = date.getDay();
    const mapped = dayIndex === 0 ? 6 : dayIndex - 1;
    counts[mapped]++;
  });
  return days.map((day, idx) => ({ day, resolved: counts[idx] }));
};

// --- Export to CSV ---
const exportToCSV = (complaints, filename) => {
  if (!complaints.length) return;
  const data = complaints.map(c => ({
    Title: c.title,
    Category: c.category,
    Status: c.status,
    Created: new Date(c.createdAt).toLocaleDateString(),
    Resolution: c.resolutionNotes || 'N/A'
  }));
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => `"${(row[header] || '').replace(/"/g, '""')}"`);
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);
  
  // State
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview"); 
  const [showForm, setShowForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState({ name: "Resident", email: "", role: "Citizen", avatar: "" });

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Fetch Data
const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    
    // Changed axios.get to API.get and removed localhost
    const res = await API.get("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(res.data);
  } catch (err) { 
    navigate("/login"); 
  }
};

const fetchUserComplaints = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    
    // Changed axios.get to API.get and removed localhost
    const res = await API.get("/api/complaints/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setComplaints(res.data || []);
  } catch (err) {
    console.error("Error fetching complaints");
    showToast("Failed to load complaints", "error");
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (id) => {
  if (!window.confirm("Delete this report permanently?")) return;
  try {
    const token = localStorage.getItem("token");
    
    // Changed axios.delete to API.delete and removed localhost
    await API.delete(`/api/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    showToast("Complaint deleted successfully");
    fetchUserComplaints();
  } catch (err) {
    showToast("Delete failed", "error");
  }
};

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserComplaints();
    const closeMenu = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.escalated).length,
  };
  const weeklyData = computeWeeklyResolved(complaints);

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Water': return { icon: '💧', bg: 'bg-sky-100 dark:bg-sky-500/10 text-sky-700' };
      case 'Electricity': return { icon: '⚡', bg: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700' };
      default: return { icon: '🚧', bg: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700' };
    }
  };

  const filteredTasks = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && c.status !== 'Resolved') ||
      (filterStatus === 'resolved' && c.status === 'Resolved');
    if (activeSection === "active") return matchesSearch && c.status !== "Resolved" && statusMatch;
    if (activeSection === "history") return matchesSearch && c.status === "Resolved" && statusMatch;
    return matchesSearch && statusMatch;
  });

  const renderMainDisplay = () => {
    if (activeSection === "map") return <LiveMap darkMode={darkMode} complaints={complaints} />;
    if (activeSection === "announcements") return <AnnouncementsList darkMode={darkMode} />;
    if (activeSection === "emergency") return <EmergencyGrid darkMode={darkMode} />;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Stats Grid with colorful hover effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
          ) : (
            <>
              <StatCard title="Total Reports" value={stats.total} icon={<FaTicketAlt />} colorScheme="indigo" trend="+8%" />
              <StatCard title="Active" value={stats.active} icon={<FaClock />} colorScheme="amber" trend="Pending" trendUp={false} />
              <StatCard title="Resolved" value={stats.resolved} icon={<FaCheckCircle />} colorScheme="emerald" trend={`${stats.total ? Math.round((stats.resolved/stats.total)*100) : 0}% rate`} />
              <StatCard title="Escalated" value={stats.escalated} icon={<FaExclamationTriangle />} colorScheme="rose" trend="Urgent" trendUp={false} />
            </>
          )}
        </div>

        {/* Weekly Resolution Chart */}
        {!loading && stats.total > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-indigo-600">Weekly Resolution Trend</h3>
              <FaChartLine className="text-slate-400" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="resolved" fill="#6366f1" radius={[6,6,0,0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Complaints Table with enhanced filtering */}
        <div className={`rounded-3xl border overflow-hidden shadow-xl transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="px-6 py-5 border-b dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <FaTicketAlt className="text-indigo-600 text-sm" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest text-indigo-600">
                {activeSection === "overview" ? "All Reports" : activeSection === "active" ? "Active Cases" : "Resolved History"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input 
                  type="text" 
                  placeholder="Search by title..." 
                  className={`pl-11 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all w-full md:w-56 ${darkMode ? "bg-slate-950 border-slate-700 focus:border-indigo-500" : "bg-slate-50 border-slate-200 focus:border-indigo-600"}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className={`px-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${darkMode ? "bg-slate-950 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="resolved">Resolved Only</option>
              </select>
              <button 
                onClick={() => exportToCSV(filteredTasks, `my_complaints_${new Date().toISOString().slice(0,10)}.csv`)}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition"
              >
                <FaFileExport /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 font-black">Issue Details</th>
                  <th className="px-6 py-4 font-black">Submitted</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black text-right">Action</th>
                </tr>
              </thead>
              {loading ? <TableSkeleton /> : (
                <tbody className="divide-y dark:divide-slate-800">
                  {filteredTasks.length > 0 ? filteredTasks.map((ticket) => {
                    const style = getCategoryStyles(ticket.category);
                    const isExpanded = expandedRows[ticket._id];
                    return (
                      <React.Fragment key={ticket._id}>
                        <tr className={`group transition-all ${isExpanded ? (darkMode ? "bg-indigo-500/5" : "bg-indigo-50/30") : (darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50")}`}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${style.bg}`}>{style.icon}</div>
                              <div>
                                <p className="font-black text-sm tracking-tight">{ticket.title}</p>
                                <button onClick={() => toggleRow(ticket._id)} className="text-[9px] text-indigo-500 font-black uppercase mt-1 flex items-center gap-1 hover:text-indigo-400">
                                  {isExpanded ? <><FaTimes /> Hide Details</> : <><FaChevronRight /> View Details</>}
                                </button>
                              </div>
                            </div>
                           </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <FaCalendarAlt className="opacity-30" />
                              {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-2 text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                                ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button onClick={() => handleDelete(ticket._id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><FaTrashAlt /></button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={`${darkMode ? "bg-slate-800/20" : "bg-indigo-50/10"}`}>
                            <td colSpan="4" className="px-6 py-6 border-l-[3px] border-indigo-500">
                              <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3">
                                    <FaQuoteLeft className="text-indigo-600/20 text-2xl shrink-0 mt-1" />
                                    <div>
                                      <h5 className="text-[9px] font-black uppercase text-indigo-500 mb-1 tracking-wider">Your Description</h5>
                                      <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                        {ticket.description || "No details provided."}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3 mt-4">
                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-slate-500/10 text-slate-500">Ref: #{ticket._id.slice(-6)}</span>
                                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-indigo-500/10 text-indigo-500">Cat: {ticket.category}</span>
                                  </div>
                                </div>

                                {ticket.status === 'Resolved' && ticket.resolutionNotes && (
                                  <div className="flex-1">
                                    <div className={`p-4 rounded-2xl border ${
                                      darkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                    }`}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <FaCheckCircle className="text-emerald-500 text-sm" />
                                        <h5 className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Resolution</h5>
                                      </div>
                                      <p className={`text-sm italic font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                                        "{ticket.resolutionNotes}"
                                      </p>
                                      <div className="mt-3 text-right">
                                        <p className="text-[8px] font-black uppercase text-slate-400">Completed on {new Date(ticket.updatedAt).toLocaleDateString()}</p>
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
                  }) : (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <FaTicketAlt size={40} />
                          <p className="font-black uppercase text-[10px] tracking-widest">No complaints found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-80 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 transform transition-transform duration-300 ease-out shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <FaTicketAlt className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">FixIt<span className="text-indigo-400">Citizen</span></span>
              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Public Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><FaTimes /></button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-4">My Reports</p>
          <SidebarItem icon={<FaTicketAlt />} label="Dashboard" active={activeSection === "overview"} onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaClock />} label="Active Status" active={activeSection === "active"} onClick={() => { setActiveSection("active"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaHistory />} label="Archives" active={activeSection === "history"} onClick={() => { setActiveSection("history"); setSidebarOpen(false); }} />
          
          <div className="pt-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-2">Community</p>
            <SidebarItem icon={<FaMapMarkedAlt />} label="Issue Map" active={activeSection === "map"} onClick={() => { setActiveSection("map"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaBullhorn />} label="Notices" active={activeSection === "announcements"} onClick={() => { setActiveSection("announcements"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaPhoneAlt />} label="Emergencies" active={activeSection === "emergency"} onClick={() => { setActiveSection("emergency"); setSidebarOpen(false); }} />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-700/50 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300">
              <FaUserCircle />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Citizen</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`h-20 px-6 lg:px-10 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md border-b ${darkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white"><FaBars /></button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-black tracking-tight capitalize">{activeSection} <span className="text-indigo-600">Portal</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition">
              {darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-600" />}
            </button>
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2">
              <FaPlus /> New Report
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all border border-transparent ${showProfileMenu ? (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200') : (darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black shadow-md overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="pfp" /> : user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold">{user.name.split(' ')[0]}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Citizen</p>
                </div>
                <FaChevronDown className={`text-slate-400 text-[10px] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border p-2 z-[60] animate-in fade-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  <div className="px-4 py-3 border-b dark:border-slate-800 mb-1">
                    <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">Citizen ID</p>
                    <p className="text-xs font-bold truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-xs font-black uppercase"><FaUserCircle /> My Account</Link>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-all text-xs font-black uppercase"><FaSignOutAlt /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto pb-20">
            {renderMainDisplay()}
          </div>
        </main>
      </div>

      {/* Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={22}/></button>
            <SubmitComplaint darkMode={darkMode} fetchComplaints={() => { fetchUserComplaints(); setShowForm(false); showToast("Complaint submitted successfully"); }} />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components (LiveMap, SidebarItem, StatCard, EmergencyGrid, AnnouncementsList) ---
const LiveMap = ({ darkMode, complaints }) => {
  const position = [51.505, -0.09]; 
  return (
    <div className={`h-[60vh] md:h-[70vh] w-full rounded-3xl overflow-hidden border shadow-2xl animate-in fade-in duration-700 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url={darkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        {complaints.filter(c => c.latitude && c.longitude).map((c) => (
          <Marker key={c._id} position={[c.latitude, c.longitude]}>
            <Popup>
              <div className="p-1 font-sans">
                <h4 className="font-black text-indigo-600 uppercase text-[10px] mb-1">{c.category}</h4>
                <p className="font-bold text-slate-800 text-sm">{c.title}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{c.status}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer text-xs font-black transition-all uppercase tracking-wider ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-indigo-400"}`}>
    <span className="text-base">{icon}</span> {label}
  </div>
);

const StatCard = ({ title, value, icon, colorScheme = "indigo", trend, trendUp = true }) => {
  const hoverBgClass = {
    indigo: "hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-500/10",
    amber: "hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-500/10",
    emerald: "hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10",
    rose: "hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-500/10",
  }[colorScheme];
  const iconColorClass = {
    indigo: "text-indigo-500 group-hover:text-indigo-600",
    amber: "text-amber-500 group-hover:text-amber-600",
    emerald: "text-emerald-500 group-hover:text-emerald-600",
    rose: "text-rose-500 group-hover:text-rose-600",
  }[colorScheme];
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 ${hoverBgClass} hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`transition-all duration-300 scale-100 group-hover:scale-110 ${iconColorClass}`}>
          {icon}
        </div>
        {trend && <span className={`text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{trend}</span>}
      </div>
      <h4 className="text-3xl font-black dark:text-white">{value}</h4>
      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-1">{title}</p>
    </div>
  );
};

const EmergencyGrid = ({ darkMode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
    <EmergencyItem title="Fire & Rescue" num="911" color="bg-red-500" darkMode={darkMode} />
    <EmergencyItem title="Medical / Ambulance" num="112" color="bg-emerald-500" darkMode={darkMode} />
    <EmergencyItem title="Power Hazard" num="08008658" color="bg-amber-500" darkMode={darkMode} />
    <EmergencyItem title="Water Main Burst" num="0800426" color="bg-blue-500" darkMode={darkMode} />
  </div>
);

const EmergencyItem = ({ title, num, color, darkMode }) => (
  <div className={`p-6 rounded-3xl border flex justify-between items-center transition-all hover:shadow-lg ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
    <div className="flex items-center gap-4">
      <div className={`${color} p-3 rounded-2xl text-white shadow-lg`}><FaPhoneAlt /></div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black">{num}</p>
      </div>
    </div>
    <a href={`tel:${num}`} className="text-[10px] font-black uppercase text-indigo-600 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Call Now</a>
  </div>
);

const AnnouncementsList = ({ darkMode }) => (
  <div className="space-y-4 max-w-3xl animate-in slide-in-from-right-4 duration-500">
    <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase">Scheduled Maintenance</span>
        <span className="text-[9px] font-bold text-slate-400">2 hours ago</span>
      </div>
      <h4 className="text-lg font-black mb-2">Central Park Water Main Repairs</h4>
      <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Expect low pressure in Sector 4 until 5 PM today as our teams replace aged valve systems.</p>
    </div>
    <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase">Service Update</span>
        <span className="text-[9px] font-bold text-slate-400">Yesterday</span>
      </div>
      <h4 className="text-lg font-black mb-2">New Complaint Tracking System</h4>
      <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>You can now track the real-time status of your complaints and receive notifications when resolved.</p>
    </div>
  </div>
);

export default UserDashboard;