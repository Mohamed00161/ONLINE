import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
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
  FaBars, FaChevronDown
} from "react-icons/fa";

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

const UserDashboard = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const dropdownRef = useRef(null);
  
  // State
  const [complaints, setComplaints] = useState([]);
  const [activeSection, setActiveSection] = useState("overview"); 
  const [showForm, setShowForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [user, setUser] = useState({ name: "Resident", email: "", role: "Citizen", avatar: "" });

  // Fetch Data
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

  const fetchUserComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://online-backend-8khb.onrender.com/api/complaints/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data || []);
    } catch (err) { console.error("Error fetching complaints"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report permanently?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://online-backend-8khb.onrender.com/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserComplaints();
    } catch (err) { alert("Delete failed."); }
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

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'Water': return { icon: '💧', bg: 'bg-blue-500/10' };
      case 'Electricity': return { icon: '⚡', bg: 'bg-amber-500/10' };
      default: return { icon: '🚧', bg: 'bg-orange-500/10' };
    }
  };

  const filteredTasks = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeSection === "active") return matchesSearch && c.status !== "Resolved";
    if (activeSection === "history") return matchesSearch && c.status === "Resolved";
    return matchesSearch;
  });

  const renderMainDisplay = () => {
    if (activeSection === "map") return <LiveMap darkMode={darkMode} complaints={complaints} />;
    if (activeSection === "announcements") return <AnnouncementsList darkMode={darkMode} />;
    if (activeSection === "emergency") return <EmergencyGrid />;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Reports" value={complaints.length} icon={<FaTicketAlt className="text-indigo-500" />} color="border-l-indigo-500" />
          <StatCard title="Active" value={complaints.filter(c => c.status !== 'Resolved').length} icon={<FaClock className="text-amber-500" />} color="border-l-amber-500" />
          <StatCard title="Resolved" value={complaints.filter(c => c.status === 'Resolved').length} icon={<FaCheckCircle className="text-emerald-500" />} color="border-l-emerald-500" />
        </div>

        {/* Enhanced Table */}
        <div className={`rounded-[2.5rem] border overflow-hidden shadow-xl transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600">
                {activeSection === "overview" ? "All Citizen Reports" : activeSection === "active" ? "Pending Action" : "Archived Cases"}
              </h3>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input 
                  type="text" 
                  placeholder="Filter reports..." 
                  className={`pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all w-full md:w-64 ${darkMode ? "bg-slate-950 border-slate-800 focus:border-indigo-500" : "bg-slate-50 border-slate-200 focus:border-indigo-600"}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-8 py-5 font-black">Issue Details</th>
                  <th className="px-8 py-5 font-black">Timeline</th>
                  <th className="px-8 py-5 font-black">Status</th>
                  <th className="px-8 py-5 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredTasks.length > 0 ? filteredTasks.map((ticket) => {
                  const style = getCategoryStyles(ticket.category);
                  const isExpanded = expandedRows[ticket._id];
                  return (
                    <React.Fragment key={ticket._id}>
                      <tr className={`group transition-all ${isExpanded ? (darkMode ? "bg-indigo-500/5" : "bg-indigo-50/30") : (darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50")}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm ${style.bg}`}>{style.icon}</div>
                            <div>
                              <p className="font-black text-sm tracking-tight">{ticket.title}</p>
                              <button onClick={() => toggleRow(ticket._id)} className="text-[9px] text-indigo-500 font-black uppercase mt-1 flex items-center gap-1 hover:text-indigo-400">
                                {isExpanded ? <><FaTimes /> Close Description</> : <><FaChevronRight /> See Details</>}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <FaCalendarAlt className="opacity-30" />
                            {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-2 text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                              ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button onClick={() => handleDelete(ticket._id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><FaTrashAlt /></button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={`${darkMode ? "bg-slate-800/20" : "bg-indigo-50/10"}`}>
                          <td colSpan="4" className="px-8 py-8 border-l-[4px] border-indigo-600">
                            <div className="flex gap-4 animate-in slide-in-from-top-2 duration-300">
                              <FaQuoteLeft className="text-indigo-600/20 text-4xl shrink-0" />
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-[10px] font-black uppercase text-indigo-500 mb-1">Citizen Statement</h5>
                                  <p className={`text-sm font-medium leading-relaxed max-w-2xl ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                    {ticket.description || "No specific details were provided for this issue."}
                                  </p>
                                </div>
                                <div className="flex gap-4">
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-500/10 text-slate-500">Ref: #{ticket._id.slice(-6).toUpperCase()}</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-indigo-500/10 text-indigo-500">Cat: {ticket.category}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <FaTicketAlt size={48} />
                        <p className="font-black uppercase text-[10px] tracking-widest">No matching records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-[110] w-72 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out border-r border-slate-900 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-500">
            <FaTicketAlt size={22} />
            <span className="text-xl font-black tracking-tighter uppercase text-white">FixIt<span className="text-slate-500 font-light">Pro</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><FaTimes /></button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 mb-2">Reports</p>
          <SidebarItem icon={<FaTicketAlt />} label="Dashboard" active={activeSection === "overview"} onClick={() => { setActiveSection("overview"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaClock />} label="Active Status" active={activeSection === "active"} onClick={() => { setActiveSection("active"); setSidebarOpen(false); }} />
          <SidebarItem icon={<FaHistory />} label="Archives" active={activeSection === "history"} onClick={() => { setActiveSection("history"); setSidebarOpen(false); }} />
          
          <div className="pt-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4 mb-2">Community</p>
            <SidebarItem icon={<FaMapMarkedAlt />} label="Issue Map" active={activeSection === "map"} onClick={() => { setActiveSection("map"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaBullhorn />} label="Notices" active={activeSection === "announcements"} onClick={() => { setActiveSection("announcements"); setSidebarOpen(false); }} />
            <SidebarItem icon={<FaPhoneAlt />} label="Emergencies" active={activeSection === "emergency"} onClick={() => { setActiveSection("emergency"); setSidebarOpen(false); }} />
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`h-24 px-6 md:px-10 flex justify-between items-center z-50 ${darkMode ? "bg-slate-950/50" : "bg-white/50"} backdrop-blur-md border-b ${darkMode ? "border-slate-900" : "border-slate-100"}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-indigo-600 text-white"><FaBars /></button>
            <h2 className="text-xl md:text-2xl font-black tracking-tighter capitalize hidden sm:block">
              {activeSection} <span className="text-indigo-600">Portal</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 md:px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
               + <span className="hidden sm:inline">File Report</span><span className="sm:hidden">Report</span>
            </button>
            
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={`flex items-center gap-3 p-1 rounded-2xl transition-all ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black overflow-hidden shadow-lg">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="pfp" /> : user.name.charAt(0)}
                </div>
                <FaChevronDown className="text-slate-400 text-[10px] hidden sm:block" />
              </button>
              {showProfileMenu && (
                <div className={`absolute right-0 mt-3 w-56 rounded-3xl shadow-2xl border p-2 z-[60] ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} animate-in zoom-in-95 duration-200`}>
                   <div className="px-4 py-3 border-b border-slate-500/10 mb-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Citizen Profile</p>
                      <p className="text-xs font-bold truncate">{user.email}</p>
                   </div>
                   <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-black uppercase"><FaUserCircle /> Profile</Link>
                   <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase text-red-500"><FaSignOutAlt /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto pb-20">
            {renderMainDisplay()}
          </div>
        </main>
      </div>

      {/* COMPLAINT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-[3rem] p-8 md:p-12 relative shadow-2xl animate-in zoom-in-95 duration-300 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={24}/></button>
            <SubmitComplaint darkMode={darkMode} fetchComplaints={() => { fetchUserComplaints(); setShowForm(false); }} />
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const LiveMap = ({ darkMode, complaints }) => {
  const position = [51.505, -0.09]; 
  return (
    <div className={`h-[60vh] md:h-[70vh] w-full rounded-[3rem] overflow-hidden border shadow-2xl animate-in fade-in duration-700 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
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
  <div onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer text-xs font-black transition-all uppercase tracking-widest ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]" : "text-slate-400 hover:bg-slate-900 hover:text-indigo-400"}`}>
    <span className="text-lg">{icon}</span> {label}
  </div>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-8 rounded-[2.5rem] border-l-[6px] ${color} shadow-sm border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform`}>
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl bg-slate-50 dark:bg-slate-800">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black">{value}</h3>
      </div>
    </div>
  </div>
);

const EmergencyGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
     <EmergencyItem title="Fire & Rescue" num="911" color="bg-red-500" />
     <EmergencyItem title="Medical / Ambulance" num="112" color="bg-emerald-500" />
     {/* Note: Ensure the phone numbers here are valid for your region or keep these placeholders */}
     <EmergencyItem title="Power Hazard" num="08008658" color="bg-amber-500" />
     <EmergencyItem title="Water Main Burst" num="0800426" color="bg-blue-500" />
  </div>
);

const EmergencyItem = ({ title, num, color }) => (
  <div className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`${color} p-4 rounded-2xl text-white shadow-lg`}><FaPhoneAlt /></div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black">{num}</p>
      </div>
    </div>
    
    {/* Functional Dialer Link */}
    <a 
      href={`tel:${num}`} 
      className="text-[10px] font-black uppercase text-indigo-600 px-6 py-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-center"
    >
      Call Now
    </a>
  </div>
);



const AnnouncementsList = ({ darkMode }) => (
  <div className="space-y-4 max-w-3xl animate-in slide-in-from-right-4 duration-500">
    <div className={`p-8 rounded-[2.5rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase">Scheduled Maintenance</span>
        <span className="text-[10px] font-bold text-slate-400">2 hours ago</span>
      </div>
      <h4 className="text-lg font-black mb-2">Central Park Water Main Repairs</h4>
      <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Expect low pressure in Sector 4 until 5 PM today as our teams replace aged valve systems.</p>
    </div>
  </div>
);

export default UserDashboard;