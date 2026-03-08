import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  FaSignOutAlt, FaTimes, FaToolbox, FaClock, FaEdit, FaChartLine, FaBars, 
  FaExclamationTriangle, FaUserCircle, FaQuoteLeft, FaHistory, FaChevronDown, 
  FaSearch, FaCalendarAlt, FaChevronRight, FaCheckCircle, FaSpinner, FaPhone, FaEnvelope, FaBullhorn
} from "react-icons/fa";

const weeklyData = [
  { day: 'Mon', resolved: 12 },
  { day: 'Tue', resolved: 19 },
  { day: 'Wed', resolved: 15 },
  { day: 'Thu', resolved: 25 },
  { day: 'Fri', resolved: 32 },
  { day: 'Sat', resolved: 10 },
  { day: 'Sun', resolved: 8 },
];

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State
  const [complaints, setComplaints] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({ name: "Staff Member", email: "", role: "Technician", avatar: "" });

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      const res = await axios.get("https://online-backend-8khb.onrender.com/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) { navigate("/login"); }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://online-backend-8khb.onrender.com/api/complaints/assigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data || []);
    } catch (err) { console.error("Fetch error", err); }
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

  // Handlers
  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim()) return alert("Please provide resolution notes.");
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`https://online-backend-8khb.onrender.com/api/complaints/${selectedTask._id}/resolve`, 
        { note: resolutionNote, status: "Resolved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTask(null);
      setResolutionNote("");
      fetchComplaints();
    } catch (err) {
      alert("Error updating ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => c.status !== 'Resolved').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => c.escalated).length,
  };

  const filteredTasks = complaints.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeSection === "active") return matchesSearch && c.status !== "Resolved";
    if (activeSection === "history") return matchesSearch && c.status === "Resolved";
    if (activeSection === "escalated") return matchesSearch && c.escalated;
    return matchesSearch;
  });

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Water': return { icon: '💧', bg: 'bg-blue-500/10' };
      case 'Electricity': return { icon: '⚡', bg: 'bg-amber-500/10' };
      default: return { icon: '🚧', bg: 'bg-indigo-500/10' };
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50 text-slate-900">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-72 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out border-r border-slate-900 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-500">
            <FaToolbox size={22} />
            <span className="text-xl font-black tracking-tighter uppercase text-white">FixIt<span className="text-slate-500 font-light">Staff</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><FaTimes /></button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 mb-2">Internal Ops</p>
          <SidebarItem icon={<FaChartLine />} label="Dashboard" active={activeSection === "overview"} onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaClock />} label="Active Jobs" active={activeSection === "active"} onClick={() => { setActiveSection("active"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaHistory />} label="Archives" active={activeSection === "history"} onClick={() => { setActiveSection("history"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaExclamationTriangle />} label="Escalated" active={activeSection === "escalated"} onClick={() => { setActiveSection("escalated"); setSidebarOpen(false); }} />
        </nav>

        <div className="p-6 border-t border-slate-900">
            <button onClick={() => {localStorage.removeItem("token"); navigate("/login")}} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase text-red-500 hover:bg-red-500/10 transition-all">
                <FaSignOutAlt /> Sign Out
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 px-6 md:px-10 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white"><FaBars /></button>
            <h2 className="text-xl md:text-2xl font-black tracking-tighter capitalize hidden sm:block">
              Staff <span className="text-indigo-600">Console</span>
            </h2>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black overflow-hidden shadow-lg">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="pfp" /> : user.name.charAt(0)}
              </div>
              <FaChevronDown className="text-slate-400 text-[10px] hidden sm:block" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 rounded-3xl shadow-2xl border border-slate-200 bg-white p-2 z-[60] animate-in zoom-in-95 duration-200">
                 <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Internal ID</p>
                    <p className="text-xs font-bold truncate text-slate-700">#{user.role}-{user.name.split(' ')[0]}</p>
                 </div>
                 <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-xs font-black uppercase text-slate-600"><FaUserCircle /> My Account</Link>
                 <div className="h-px bg-slate-100 my-1 mx-2" />
                 <button onClick={() => {localStorage.removeItem("token"); navigate("/login")}} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all text-xs font-black uppercase"><FaSignOutAlt /> Sign Out</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-10 pb-20">
            
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-200 overflow-hidden relative">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/20 p-3 rounded-xl"><FaBullhorn className="animate-bounce" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Department Memo</p>
                        <p className="text-sm font-bold">New Safety Protocols updated for Electrical Maintenance.</p>
                    </div>
                </div>
                <FaToolbox className="absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <StatCard title="Total Assigned" value={stats.total} icon={<FaToolbox className="text-indigo-500" />} color="border-l-indigo-500" />
              <StatCard title="Pending Resolution" value={stats.active} icon={<FaClock className="text-amber-500" />} color="border-l-amber-500" />
              <StatCard title="Critical/Escalated" value={stats.escalated} icon={<FaExclamationTriangle className="text-rose-500" />} color="border-l-rose-500" />
            </div>

            {activeSection === "overview" && (
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600 mb-8">Weekly Resolution Trends</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold'}} />
                                <Bar dataKey="resolved" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Active Work Orders</h3>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input type="text" placeholder="Filter jobs..." className="pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 bg-slate-50 w-full md:w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/50">
                      <th className="px-8 py-5 font-black">Issue Detail</th>
                      <th className="px-8 py-5 font-black">Assigned On</th>
                      <th className="px-8 py-5 font-black">Status</th>
                      <th className="px-8 py-5 font-black text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((ticket) => {
                      const style = getCategoryStyles(ticket.category);
                      const isExpanded = expandedRows[ticket._id];
                      return (
                        <React.Fragment key={ticket._id}>
                          <tr className={`group transition-all ${isExpanded ? "bg-indigo-50/50" : "hover:bg-slate-50/80"}`}>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm ${style.bg}`}>{style.icon}</div>
                                <div>
                                  <p className="font-black text-sm tracking-tight text-slate-800">{ticket.title}</p>
                                  <div className="flex gap-2 mt-1">
                                    <button onClick={() => toggleRow(ticket._id)} className="text-[9px] text-indigo-500 font-black uppercase flex items-center gap-1">
                                      {isExpanded ? "Hide" : "Details"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="text-xs font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {ticket.status}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              {ticket.status !== 'Resolved' && (
                                <button onClick={() => setSelectedTask(ticket)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">Resolve</button>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/30">
                              <td colSpan="4" className="px-8 py-8 border-l-[4px] border-indigo-600">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <h5 className="text-[10px] font-black uppercase text-indigo-500 mb-2">Issue Description</h5>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{ticket.description}</p>
                                    </div>
                                    <div className="w-full md:w-64 space-y-3">
                                        <h5 className="text-[10px] font-black uppercase text-slate-400">Citizen Contact</h5>
                                        <div className="flex flex-col gap-2">
                                            <a href={`tel:${ticket.citizenPhone || "000"}`} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:border-indigo-500 transition-all">
                                                <FaPhone className="text-indigo-500" /> Call Citizen
                                            </a>
                                            <a href={`mailto:${ticket.citizenEmail || "mail@fixit.com"}`} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-700 hover:border-indigo-500 transition-all">
                                                <FaEnvelope className="text-indigo-500" /> Email Citizen
                                            </a>
                                        </div>
                                    </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[3rem] p-8 md:p-12 relative shadow-2xl bg-white animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedTask(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><FaTimes size={24}/></button>
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tighter text-slate-900">Finalize <span className="text-indigo-500">Fix</span></h2>
                <p className="text-slate-500 font-bold text-sm mt-2">Update work order for: {selectedTask.title}</p>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-4 mb-2 block">Resolution Details</label>
                    <textarea 
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Detail the technical steps taken..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-bold text-slate-700 focus:border-indigo-600 outline-none min-h-[150px]"
                    />
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setSelectedTask(null)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest">Discard</button>
                    <button 
                        onClick={handleResolve}
                        disabled={isSubmitting}
                        className="flex-2 py-4 px-8 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSubmitting ? <FaSpinner className="animate-spin" /> : "Submit Completion"}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer text-xs font-black transition-all uppercase tracking-widest ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]" : "text-slate-400 hover:bg-slate-900 hover:text-indigo-400"}`}>
    <span className="text-lg">{icon}</span> {label}
  </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-8 rounded-[2.5rem] border-l-[6px] ${color} shadow-sm border bg-white border-slate-200 hover:scale-[1.02] transition-transform`}>
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl bg-slate-50">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      </div>
    </div>
  </div>
);

export default EmployeeDashboard;