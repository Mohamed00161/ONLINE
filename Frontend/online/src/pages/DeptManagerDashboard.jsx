import React, { useEffect, useState, useMemo, useRef } from "react";
import API from "../Api.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaClipboardList, FaHourglassHalf, FaSpinner, FaCheckCircle,
  FaSignOutAlt, FaUserTie, FaChartPie, FaArchive,
  FaSun, FaMoon, FaUsers, FaFileAlt, FaUserPlus, FaHistory, FaPaperPlane,
  FaChevronDown, FaBars, FaTimes, FaChartLine, FaBell, FaFilter, FaSearch,
  FaExclamationTriangle, FaFlag, FaStickyNote, FaArrowUp, FaExchangeAlt,
  FaFileExport, FaCalendarAlt, FaEye, FaTrashAlt
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Toast Component ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500';
  return (
    <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-in slide-in-from-right-5 duration-300 ${bgColor}`}>
      {type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
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
  <>
    {[1, 2, 3].map(i => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 mt-1"></div></td>
        <td className="px-6 py-5"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-40"></div></td>
        <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-32"></div></td>
        <td className="px-6 py-5"><div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div></td>
      </tr>
    ))}
  </>
);

// --- Helper Functions ---
const computeWeeklyTrend = (complaints) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = new Array(7).fill(0);
  complaints.filter(c => c.status === "Completed" || c.status === "Resolved").forEach(c => {
    const date = new Date(c.updatedAt);
    const dayIndex = date.getDay();
    const mapped = dayIndex === 0 ? 6 : dayIndex - 1;
    counts[mapped]++;
  });
  return days.map((day, idx) => ({ day, resolved: counts[idx] }));
};

const exportToCSV = (data, filename) => {
  if (!data.length) return;
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

const DeptManagerDashboard = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // State
  const [complaints, setComplaints] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [manager, setManager] = useState({ name: "", email: "", department: "" });
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", category: "General Maintenance" });
  const [isInviting, setIsInviting] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignEmployeeId, setReassignEmployeeId] = useState("");
  

  const categories = ["Electricity Supply", "Water Supply", "Waste", "Infrastructure", "General Maintenance", "Health Infrastructure"];
  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Data fetching
 const fetchProfileAndData = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login");
    return;
  }
  setLoading(true);
  const config = { headers: { Authorization: `Bearer ${token}` } };
  try {
    // Swapped axios for API and removed the hardcoded localhost prefix
    const profRes = await API.get("/api/profile", config);
    const userData = profRes.data.user || profRes.data;
    setManager(userData);

    // Swapped axios for API on both endpoints inside the Promise.all block
    const [compRes, teamRes] = await Promise.all([
      API.get("/api/complaints/my", config),
      API.get("/api/admin/employees", config).catch(() => ({ data: [] }))
    ]);

    const complaintsWithMeta = (compRes.data || []).map(c => ({
      ...c,
      priority: c.priority || "Medium",
      internalNotes: c.internalNotes || []
    }));
    setComplaints(complaintsWithMeta);
    const myDept = userData.department?.trim().toLowerCase();
    const myTeam = teamRes.data.filter(emp => emp.department?.trim().toLowerCase() === myDept);
    setTeamMembers(myTeam);
  } catch (err) {
    console.error("Fetch error", err);
    showToast("Failed to load data", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProfileAndData();
    const interval = setInterval(fetchProfileAndData, 30000);
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

// 2. Here is your updated function:
const updateComplaintField = async (complaintId, updates) => {
  try {
    const token = localStorage.getItem("token");
    
    // Swapped axios.put for API.put and removed the hardcoded localhost prefix
    await API.put(`/api/complaints/${complaintId}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    await fetchProfileAndData();
    showToast("Updated successfully");
    return true;
  } catch (err) {
    showToast("Update failed", "error");
    return false;
  }
};

  const handleSetPriority = async (complaintId, priority) => {
    await updateComplaintField(complaintId, { priority });
  };

  const handleAddInternalNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;
    const newNote = {
      text: noteText,
      createdAt: new Date().toISOString(),
      author: manager.name
    };
    const updatedNotes = [...(selectedComplaint.internalNotes || []), newNote];
    const success = await updateComplaintField(selectedComplaint._id, { internalNotes: updatedNotes });
    if (success) {
      setNoteText("");
      setShowNotesModal(false);
    }
  };

  const handleEscalate = async (complaintId) => {
    if (window.confirm("Escalate this complaint to Admin? It will be marked as escalated.")) {
      await updateComplaintField(complaintId, { escalated: true, status: "Escalated" });
    }
  };

  const handleReassign = async () => {
    if (!selectedComplaint || !reassignEmployeeId) return;
    const success = await updateComplaintField(selectedComplaint._id, { assignedEmployee: reassignEmployeeId });
    if (success) {
      setShowReassignModal(false);
      setSelectedComplaint(null);
      setReassignEmployeeId("");
    }
  };

  const handleAssignToEmployee = async (complaintId, employeeId) => {
    if (!employeeId) return;
    await updateComplaintField(complaintId, { assignedEmployee: employeeId });
  };

  const handleInviteEmployee = async (e) => {
  e.preventDefault();
  let dept = manager.department;
  if (!dept || dept === "None") {
    const savedInfo = JSON.parse(localStorage.getItem("userInfo"));
    dept = savedInfo?.department;
  }
  if (!dept || dept === "None") {
    showToast("Your account has no department assigned.", "error");
    return;
  }
  setIsInviting(true);
  try {
    const token = localStorage.getItem("token");
    const payload = {
      name: inviteForm.name.trim(),
      email: inviteForm.email.toLowerCase().trim(),
      department: dept,
      role: "employee",
      category: inviteForm.category
    };
    
    // Swapped axios.post for API.post and removed the hardcoded localhost prefix
    await API.post("/api/admin/employees", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    showToast("Technician invited successfully!");
    setInviteForm({ name: "", email: "", category: "General Maintenance" });
    fetchProfileAndData();
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Invitation failed.";
    if (errorMsg.toLowerCase().includes("already registered") || errorMsg.toLowerCase().includes("already exists")) {
      showToast("This email is already registered. Use 'Resend' from the team list.", "error");
    } else {
      showToast(errorMsg, "error");
    }
  } finally {
    setIsInviting(false);
  }
};


const fetchComplaints = async () => {
  try {
    const token = localStorage.getItem("token");
    
    const res = await API.get("/api/complaints", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setComplaints(res.data); 
  } catch (err) {
    console.error("Error fetching complaints:", err);
  }
};

// Call it on mount
useEffect(() => {
  fetchComplaints();
}, []);

const handleAssignWorker = async (complaintId, employeeId) => {
  if (!employeeId) return showToast("Please select a worker first", "error");
  
  setResendingId(complaintId);
  try {
    const token = localStorage.getItem("token");
    const cleanId = complaintId.toString().split(':')[0];

    // Swapped axios.put for API.put and removed the hardcoded localhost prefix
    await API.put(
      `/api/complaints/${cleanId}/assign-worker`,
      { employeeId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    showToast("Worker assigned successfully", "success");

    // FIX: Change 'fetchComplaints()' to whatever your loading function is named.
    if (typeof fetchComplaints === 'function') {
      fetchComplaints(); 
    } else {
      console.warn("Refresh function not found. Please reload the page to see changes.");
    }

  } catch (err) {
    console.error("Assignment error:", err);
    showToast(err.response?.data?.message || "Failed to assign worker", "error");
  } finally {
    setResendingId(null);
  }
};
// --- Team Management Handlers ---

 const handleResendInvite = async (emp) => {
  setResendingId(emp._id);
  try {
    const token = localStorage.getItem("token");
    
    // Swapped axios.post for API.post and removed the hardcoded localhost prefix
    await API.post(`/api/admin/employees/${emp._id}/resend`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showToast(`Activation link resent to ${emp.email}`, "success");
  } catch (err) {
    showToast(err.response?.data?.message || "Failed to resend link.", "error");
  } finally {
    setResendingId(null);
  }
};

const handleDeleteEmployee = async (id, name) => {
  if (!window.confirm(`Remove ${name}?`)) return;

  try {
    const token = localStorage.getItem("token");
    
    // Swapped axios.delete for API.delete and removed the hardcoded localhost prefix
    const response = await API.delete(`/api/admin/employees/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    showToast(`${name} removed successfully`);
    fetchProfileAndData();
  } catch (err) {
    console.error("Delete Error details:", err.response?.data);
    showToast(err.response?.data?.message || "Permission denied (403)", "error");
  }
};
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Statistics
  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Assigned to Dept" || !c.assignedEmployee).length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    completed: complaints.filter(c => c.status === "Completed" || c.status === "Resolved").length,
  }), [complaints]);

  const weeklyTrend = useMemo(() => computeWeeklyTrend(complaints), [complaints]);

  const deptDistribution = useMemo(() => {
    const map = new Map();
    complaints.forEach(c => {
      const cat = c.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [complaints]);

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

  const filteredComplaints = complaints.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase()) && !c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterDateRange !== 'all') {
      const days = filterDateRange === 'today' ? 1 : filterDateRange === 'week' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (new Date(c.createdAt) < cutoff) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    const colors = {
      Low: "bg-gray-100 text-gray-600",
      Medium: "bg-blue-100 text-blue-600",
      High: "bg-orange-100 text-orange-600",
      Urgent: "bg-red-100 text-red-600"
    };
    return colors[priority] || colors.Medium;
  };

  return (
    <div className={`flex h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-80 bg-slate-900 flex flex-col border-r border-white/5 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20"><FaUsers size={20} /></div>
            <div><span className="font-black text-xl text-white uppercase tracking-tighter">{manager.department || "Dept"} <span className="text-blue-400 font-light text-sm">Manager</span></span><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Control Center</p></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><FaTimes /></button>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem icon={<FaHome />} label="Overview" active={activeSection === "dashboard"} onClick={() => { setActiveSection("dashboard"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaUserTie />} label="My Team" active={activeSection === "team"} onClick={() => { setActiveSection("team"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaFileAlt />} label="Field Reports" active={activeSection === "reports"} onClick={() => { setActiveSection("reports"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaChartPie />} label="Performance" active={activeSection === "analytics"} onClick={() => { setActiveSection("analytics"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaArchive />} label="Archive" active={activeSection === "archive"} onClick={() => { setActiveSection("archive"); setSidebarOpen(false); }} />
        </nav>
        <div className="p-6 border-t border-white/10"><div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50"><div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300"><FaUserTie /></div><div className="flex-1"><p className="text-xs font-bold text-white truncate">{manager.name || "Manager"}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Department Head</p></div></div></div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 px-6 lg:px-10 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-50">
          <div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-blue-600 text-white"><FaBars /></button><div><h2 className="text-xl font-black capitalize tracking-tight">{activeSection.replace("-", " ")}</h2><p className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Departmental Control Center</p></div></div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition">{darkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-blue-600" />}</button>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"><div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md overflow-hidden">{manager.avatar ? <img src={manager.avatar} className="w-full h-full object-cover" /> : manager.name?.charAt(0) || "M"}</div><div className="hidden md:block text-left"><p className="text-xs font-bold">{manager.name?.split(' ')[0] || "Manager"}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Verified</p></div><FaChevronDown size={10} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} /></button>
              {showUserMenu && (<div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50"><div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b dark:border-slate-800"><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Department Access</p><p className="text-xs font-bold truncate">{manager.department || "General"} Administration</p></div><div className="p-2"><button onClick={() => { navigate("/profile"); setShowUserMenu(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"><FaUserTie /> My Profile</button><div className="h-px bg-slate-100 dark:bg-slate-800 my-1" /><button onClick={logout} className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"><FaSignOutAlt /> Sign Out</button></div></div>)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar">
          {/* OVERVIEW SECTION */}
{activeSection === "dashboard" && (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Welcome Header */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
      <div className="relative z-10">
        <h3 className="text-3xl lg:text-4xl font-black tracking-tighter">
          Welcome back, {manager.name?.split(' ')[0] || "Manager"}
        </h3>
        <p className="text-blue-100 font-medium mt-2">
          You have {stats.pending} unassigned tasks. {teamMembers.length} technicians on your team.
        </p>
      </div>
      <FaUsers className="absolute -right-10 -bottom-10 text-[12rem] text-white/10 rotate-12" />
    </div>

    {/* Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {loading ? (
        <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
      ) : (
        <>
          <StatCard title="Total Tasks" value={stats.total} icon={<FaClipboardList />} colorScheme="blue" trend="+12%" />
          <StatCard title="Unassigned" value={stats.pending} icon={<FaHourglassHalf />} colorScheme="amber" trend="Critical" trendUp={false} />
          <StatCard title="In Progress" value={stats.inProgress} icon={<FaSpinner className="animate-spin" />} colorScheme="indigo" trend="Active" />
          <StatCard title="Completed" value={stats.completed} icon={<FaCheckCircle />} colorScheme="emerald" trend={`${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% rate`} />
        </>
      )}
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xs uppercase tracking-widest text-blue-600">Weekly Resolutions</h3>
          <FaChartLine className="text-slate-400" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Bar dataKey="resolved" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-xs uppercase tracking-widest text-blue-600">Task Distribution</h3>
          <FaChartPie className="text-slate-400" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {deptDistribution.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} strokeWidth={2} stroke="#fff" />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Active Task Queue */}
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col md:flex-row justify-between gap-4">
        <h3 className="font-black text-sm uppercase tracking-widest text-blue-600">Active Task Queue</h3>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {/* ... other filters ... */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-black text-slate-400 border-b dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Complaint</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Assign Tech</th>
              <th className="px-6 py-4">Actions</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
<tbody className="divide-y dark:divide-slate-800">
  {loading ? (
    <TableSkeleton />
  ) : filteredComplaints.filter(c => c.status !== "Completed" && c.status !== "Resolved").length === 0 ? (
    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No pending tasks.</td></tr>
  ) : (
    filteredComplaints
      .filter(c => c.status !== "Completed" && c.status !== "Resolved")
      .map(c => (
        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
          <td className="px-6 py-5">
            <p className="font-bold text-sm whitespace-nowrap">{c.title}</p>
            <p className="text-[10px] text-blue-500 font-bold uppercase">{c.category}</p>
          </td>
          
          <td className="px-6 py-5">
            <select 
              value={c.priority || "Medium"} 
              onChange={(e) => handleSetPriority(c._id, e.target.value)} 
              className={`text-[10px] font-black px-2 py-1 rounded-full ${getPriorityBadge(c.priority)} border-0 focus:ring-1`}
            >
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </td>

          <td className="px-6 py-5">
            <select 
              onChange={(e) => handleAssignWorker(c._id, e.target.value)} 
              value={c.assignedEmployee?._id || ""} 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="" disabled>Select Technician...</option>
              {teamMembers.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </td>

          <td className="px-6 py-5">
            <div className="flex gap-2">
              <button 
                onClick={() => { setSelectedComplaint(c); setShowNotesModal(true); }} 
                title="Add Note" 
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-blue-100"
              >
                <FaStickyNote size={12} />
              </button>

              {/* FIXED: Uses c._id and the employee assigned to THIS specific row */}
              <button 
                onClick={() => handleAssignWorker(c._id, c.assignedEmployee?._id)}
                disabled={resendingId === c._id || !c.assignedEmployee}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition ${
                  resendingId === c._id ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
              >
                {resendingId === c._id ? "Processing..." : "Confirm"}
              </button>

              <button onClick={() => handleEscalate(c._id)} title="Escalate" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-red-100"><FaArrowUp size={12} /></button>
            </div>
          </td>

          <td className="px-6 py-5">
            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-blue-100 text-blue-600">
              {c.status}
            </span>
          </td>
        </tr>
      ))
  )}
</tbody>
        </table>
      </div>
    </div>
  </div>
)}

          {/* TEAM SECTION */}
          {activeSection === "team" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-2xl"><div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6"><div className="max-w-md"><h3 className="text-2xl font-black tracking-tighter mb-2">Expand Your Workforce</h3><p className="text-blue-100 text-sm">Onboard specialized technicians. They will receive an activation link via email.</p></div><form onSubmit={handleInviteEmployee} className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full"><input placeholder="Name" className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-white/50 focus:bg-white focus:text-slate-900 outline-none transition" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} /><input placeholder="Email" type="email" className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-white/50 focus:bg-white focus:text-slate-900 outline-none transition" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} /><select className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:text-slate-900 outline-none transition" value={inviteForm.category} onChange={e => setInviteForm({...inviteForm, category: e.target.value})}>{categories.map(cat => <option key={cat} value={cat} className="text-slate-900">{cat}</option>)}</select><button type="submit" className="bg-white text-blue-600 font-black rounded-2xl px-4 py-3 hover:bg-blue-50 transition active:scale-95 shadow-xl flex items-center justify-center gap-2">{isInviting ? <FaSpinner className="animate-spin" /> : <><FaUserPlus /> Invite</>}</button></form></div><FaUserPlus className="absolute -right-4 -bottom-4 text-9xl text-white/10 rotate-12" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 p-6 h-64"></div>) : teamMembers.length > 0 ? teamMembers.map(emp => (
                  <ProfessionalTeamCard 
                    key={emp._id} 
                    emp={emp} 
                    activeTasks={complaints.filter(c => c.assignedEmployee?._id === emp._id && c.status === "In Progress").length} 
                    onResend={() => handleResendInvite(emp)} 
                    isResending={resendingId === emp._id}
                    onDelete={() => handleDeleteEmployee(emp._id, emp.name)}
                  />
                )) : (<div className="col-span-full py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center"><FaUsers className="mx-auto text-4xl text-slate-300 mb-4" /><p className="text-slate-400 font-bold italic">No technicians onboarded yet.</p></div>)}
              </div>
            </div>
          )}

          {/* FIELD REPORTS SECTION */}
          {activeSection === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between"><div><h3 className="text-2xl font-black tracking-tighter">Field Reports</h3><p className="text-xs text-slate-500">Validated technician submissions</p></div><button onClick={() => exportToCSV(complaints.filter(c => c.status === "Resolved" || c.status === "Completed").map(c => ({ Title: c.title, Technician: c.assignedEmployee?.name, Resolution: c.resolutionNotes, Date: new Date(c.updatedAt).toLocaleDateString() })), "field_reports.csv")} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2"><FaFileExport /> Export CSV</button></div>
              <div className="space-y-4">
                {loading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl border p-6 h-32"></div>)}</div> : complaints.filter(c => (c.status === "Resolved" || c.status === "Completed") && c.resolutionNotes).length === 0 ? (<EmptyState icon={<FaFileAlt />} message="No field reports submitted yet." />) : (complaints.filter(c => (c.status === "Resolved" || c.status === "Completed") && c.resolutionNotes).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(c => (<div key={c._id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/30 transition-all"><div className="flex flex-col md:flex-row gap-4"><div className="flex-1"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600"><FaCheckCircle /></div><div><h4 className="font-black">{c.title}</h4><p className="text-[10px] text-slate-400 uppercase">{c.category}</p></div></div><div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl"><p className="text-sm italic">"{c.resolutionNotes}"</p></div></div><div className="md:w-48 text-right"><p className="text-[9px] font-black text-slate-400">Resolved by</p><p className="text-xs font-bold">{c.assignedEmployee?.name || "Technician"}</p><p className="text-[9px] text-slate-400 mt-1">{new Date(c.updatedAt).toLocaleDateString()}</p></div></div></div>)))}
              </div>
            </div>
          )}

          {/* PERFORMANCE SECTION */}
          {activeSection === "analytics" && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"><h4 className="text-sm font-black uppercase text-blue-500 mb-8 tracking-widest">Efficiency Metrics</h4><div className="space-y-6"><ProgressBar label="Overall Resolution" value={stats.completed} total={stats.total} color="bg-emerald-500" /><ProgressBar label="Active Load" value={stats.inProgress} total={stats.total} color="bg-blue-600" /><ProgressBar label="Task Clearance" value={stats.total - stats.pending} total={stats.total} color="bg-amber-500" /></div></div>
                <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden"><FaChartPie className="absolute -right-10 -bottom-10 text-[12rem] text-white/5 rotate-12" /><div className="relative z-10"><h4 className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">Monthly Summary</h4><p className="text-2xl font-light leading-snug">Operating at <span className="font-black text-blue-400">{stats.total ? Math.round((stats.completed/stats.total)*100) : 0}%</span> resolution rate.</p><div className="mt-6 grid grid-cols-2 gap-4"><div><p className="text-[9px] text-slate-400">Team Size</p><p className="text-2xl font-black">{teamMembers.length}</p></div><div><p className="text-[9px] text-slate-400">Avg. Response</p><p className="text-2xl font-black">2.4<span className="text-sm">d</span></p></div></div></div></div>
              </div>
            </div>
          )}

          {/* ARCHIVE SECTION - FIXED JSX SYNTAX */}
          {activeSection === "archive" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="font-black text-sm uppercase tracking-widest">Resolved Records</h3>
                <button onClick={() => exportToCSV(complaints.filter(c => c.status === "Completed" || c.status === "Resolved").map(c => ({ Title: c.title, Technician: c.assignedEmployee?.name, Completed: new Date(c.updatedAt).toLocaleDateString(), Resolution: c.resolutionNotes })), "archive.csv")} className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1">
                  <FaFileExport /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Case</th>
                      <th className="px-6 py-4">Technician</th>
                      <th className="px-6 py-4">Completed</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {loading ? (
                      <TableSkeleton />
                    ) : complaints.filter(c => c.status === "Completed" || c.status === "Resolved").length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center text-slate-400 italic">No archived records.</td>
                      </tr>
                    ) : (
                      complaints.filter(c => c.status === "Completed" || c.status === "Resolved").map(c => (
                        <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          <td className="px-6 py-5 text-sm font-bold">{c.title}</td>
                          <td className="px-6 py-5 text-xs">{c.assignedEmployee?.name || "N/A"}</td>
                          <td className="px-6 py-5 text-xs text-slate-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">Archived</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showNotesModal && selectedComplaint && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowNotesModal(false)}>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-6 text-white relative"><h3 className="text-xl font-black">Internal Note</h3><button onClick={() => setShowNotesModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white"><FaTimes /></button></div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><p className="text-xs font-bold">Complaint: {selectedComplaint.title}</p></div>
              <textarea rows="4" placeholder="Add private note (visible only to you)..." className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border focus:border-blue-500 outline-none" value={noteText} onChange={e => setNoteText(e.target.value)} />
              <button onClick={handleAddInternalNote} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition">Save Note</button>
              {selectedComplaint.internalNotes?.length > 0 && (
                <div className="mt-4 pt-4 border-t dark:border-slate-700"><p className="text-[10px] font-black text-slate-400 mb-2">Previous Notes:</p><div className="space-y-2 max-h-40 overflow-y-auto">{selectedComplaint.internalNotes.map((note, idx) => (<div key={idx} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><p className="text-xs italic">"{note.text}"</p><p className="text-[9px] text-slate-400 mt-1">{new Date(note.createdAt).toLocaleString()} - {note.author}</p></div>))}</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReassignModal && selectedComplaint && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowReassignModal(false)}>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-6 text-white relative"><h3 className="text-xl font-black">Reassign Complaint</h3><button onClick={() => setShowReassignModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white"><FaTimes /></button></div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold">{selectedComplaint.title}</p>
              <select className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border focus:border-blue-500 outline-none" value={reassignEmployeeId} onChange={e => setReassignEmployeeId(e.target.value)}>
                <option value="">Select Technician</option>
                {teamMembers.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
              <button onClick={handleReassign} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition">Reassign</button>
            </div>
          </div>
        </div>
      )}

      {showTimelineModal && selectedComplaint && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowTimelineModal(false)}>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-6 text-white relative"><h3 className="text-xl font-black">Complaint Timeline</h3><button onClick={() => setShowTimelineModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white"><FaTimes /></button></div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div className="border-l-2 border-blue-500 pl-4 py-2"><p className="text-xs font-black text-blue-500">Created</p><p className="text-sm">{new Date(selectedComplaint.createdAt).toLocaleString()}</p><p className="text-xs text-slate-500">Status: {selectedComplaint.status}</p></div>
              {selectedComplaint.assignedEmployee && (<div className="border-l-2 border-green-500 pl-4 py-2"><p className="text-xs font-black text-green-500">Assigned</p><p className="text-sm">To: {selectedComplaint.assignedEmployee.name}</p><p className="text-xs text-slate-500">Updated at: {new Date(selectedComplaint.updatedAt).toLocaleString()}</p></div>)}
              {selectedComplaint.resolutionNotes && (<div className="border-l-2 border-emerald-500 pl-4 py-2"><p className="text-xs font-black text-emerald-500">Resolved</p><p className="text-sm italic">"{selectedComplaint.resolutionNotes}"</p><p className="text-xs text-slate-500">{new Date(selectedComplaint.updatedAt).toLocaleString()}</p></div>)}
              {selectedComplaint.internalNotes?.map((note, idx) => (<div key={idx} className="border-l-2 border-amber-500 pl-4 py-2"><p className="text-xs font-black text-amber-500">Internal Note</p><p className="text-sm italic">"{note.text}"</p><p className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()} by {note.author}</p></div>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Reusable Components ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
    <span className="text-lg">{icon}</span> {label}
  </button>
);

const StatCard = ({ title, value, icon, colorScheme = "blue", trend, trendUp = true }) => {
  const hoverBgClass = { blue: "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-500/10", amber: "hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-500/10", indigo: "hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-500/10", emerald: "hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-500/10" }[colorScheme];
  const iconColorClass = { blue: "text-blue-500 group-hover:text-blue-600", amber: "text-amber-500 group-hover:text-amber-600", indigo: "text-indigo-500 group-hover:text-indigo-600", emerald: "text-emerald-500 group-hover:text-emerald-600" }[colorScheme];
  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 ${hoverBgClass} hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4"><div className={`transition-all duration-300 scale-100 group-hover:scale-110 ${iconColorClass}`}>{icon}</div>{trend && <span className={`text-[9px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{trend}</span>}</div>
      <p className="text-3xl font-black dark:text-white">{value}</p>
      <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-1">{title}</p>
    </div>
  );
};

const ProgressBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (<div className="space-y-2"><div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>{label}</span><span>{Math.round(percentage)}%</span></div><div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div></div></div>);
};

const EmptyState = ({ icon, message }) => (<div className="flex flex-col items-center justify-center py-20 text-slate-400/50"><div className="text-6xl mb-6">{icon}</div><p className="font-black italic tracking-tight">{message}</p></div>);

const ProfessionalTeamCard = ({ emp, activeTasks, onResend, isResending, onDelete }) => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all group relative">
    {/* Delete Button - Top Right */}
    <button 
      onClick={onDelete}
      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
      title="Delete Member"
    >
      <FaTrashAlt size={14} />
    </button>

    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center text-xl font-black">
        {emp.name.charAt(0)}
      </div>
      <div>
        <h4 className="font-black text-sm">{emp.name}</h4>
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{emp.category}</p>
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${emp.isRegistered ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {emp.isRegistered ? 'Verified' : 'Pending Invite'}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Tasks</span>
        <span className="text-xs font-black">{activeTasks}</span>
      </div>
    </div>

    <div className="flex gap-2">
      {!emp.isRegistered && (
        <button 
          onClick={onResend}
          disabled={isResending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
        >
          {isResending ? <FaSpinner className="animate-spin" /> : <><FaPaperPlane /> Resend Link</>}
        </button>
      )}
      <button 
        onClick={() => window.location.href = `mailto:${emp.email}`}
        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        Contact
      </button>
    </div>
  </div>
);
export default DeptManagerDashboard;