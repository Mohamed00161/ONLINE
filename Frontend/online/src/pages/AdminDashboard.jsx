import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext.jsx";
import { useNavigate, Link } from "react-router-dom"; 
import {
  FaHome, FaUserPlus, FaClipboardList, FaHourglassHalf,
  FaSpinner, FaCheckCircle, FaSignOutAlt,
  FaUserShield, FaUserTie, FaChartPie, FaTrashAlt, FaArchive, FaUserCircle,
  FaSun, FaMoon, FaHistory, FaBars, FaTimes, FaEnvelope, FaFileAlt, FaPrint, FaSearch
} from "react-icons/fa";

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, Title, PointElement, LineElement
);

const AdminDashboard = () => {
  const { darkMode, toggleTheme } = useTheme(); 
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // --- APP STATE ---
  const [complaints, setComplaints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [admin, setAdmin] = useState({ name: "Admin", email: "", avatar: "" });
  
  // --- UI STATE ---
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", department: "" });
  const [viewingReport, setViewingReport] = useState(null); 

  // --- REPORTS STATE ---
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearch, setReportSearch] = useState("");

  // --- HELPERS ---
  const getStaffName = (report) => {
    if (!report) return "Unassigned";

    // 1. Check if the backend already sent the name as an object
    const directName = 
      report.assignedEmployee?.name || 
      report.assignedTo?.name || 
      report.employeeId?.name;

    if (directName) return directName;

    // 2. If the backend sent an ID string, look it up in our 'employees' state
    const id = report.assignedEmployee || report.assignedTo || report.employeeId;

    if (id) {
      // If id is an object (but didn't have a name), try to get the string _id
      const idString = typeof id === 'object' ? id._id : id;
      const match = employees.find(emp => emp._id === idString);
      if (match) return match.name;
    }

    // 3. Fallback if data is still loading or missing
    return "Staff Member";
  };

  // --- INITIAL FETCH ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    
    fetchAdminProfile();
    fetchData();

    const interval = setInterval(fetchData, 30000);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navigate]);

  // UPDATED EFFECT: Fetches employees AND reports to ensure name matching works
  useEffect(() => {
    if (activeSection === "reports") {
        fetchData(); 
        fetchReports();
    }
  }, [activeSection]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const [compRes, empRes] = await Promise.all([
        axios.get("https://online-backend-8khb.onrender.com/api/complaints", config),
        axios.get("https://online-backend-8khb.onrender.com/admin/employees", config),
      ]);
      setComplaints(compRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) { console.error("Error fetching data:", err); }
  };

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://online-backend-8khb.onrender.com/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setAdmin(res.data);
    } catch (err) { console.error("Error fetching profile:", err); }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("https://online-backend-8khb.onrender.com/api/complaints/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); } finally { setLoadingReports(false); }
  };

  // --- HANDLERS ---
  const handlePrint = (report) => {
    if (!report) return;
    const displayDate = report.updatedAt || report.createdAt || new Date();
    const staffName = getStaffName(report);
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    const content = `
      <html>
        <head>
          <title>FixIt Pro - Official Report</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 50px; color: #333; line-height: 1.6; }
            .header { border-bottom: 4px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #1e293b; margin: 0; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 10px; }
            .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 800; }
            .value { font-size: 14px; font-weight: 600; color: #1e293b; }
            .description { padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; min-height: 200px; white-space: pre-wrap; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Official Resolution Report</div>
            <div style="color: #6366f1; font-weight: bold;">FixIt Pro Infrastructure Management</div>
          </div>
          <div class="meta">
            <div><div class="label">Incident Title</div><div class="value">${report.title}</div></div>
            <div><div class="label">Category</div><div class="value">${report.category || 'General'}</div></div>
            <div><div class="label">Lead Technician</div><div class="value">${staffName}</div></div>
            <div><div class="label">Completion Date</div><div class="value">${new Date(displayDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
          </div>
          <div class="label" style="margin-bottom: 10px;">Resolution Notes</div>
          <div class="description">${report.description || 'No detailed description provided.'}</div>
          <div class="footer">Generated by Admin: ${admin.name} | System Date: ${new Date().toLocaleString()}</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleInviteEmployee = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.department) return alert("Fill all fields");
    try {
      const token = localStorage.getItem("token");
      await axios.post("https://online-backend-8khb.onrender.com/api/admin/employees", inviteForm, { headers: { Authorization: `Bearer ${token}` } });
      setInviteForm({ name: "", email: "", department: "" });
      fetchData();
      alert("Invite Sent Successfully");
    } catch (err) { alert(err.response?.data?.message || "Invite failed."); }
  };

  const handleResendInvite = async (employeeId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`https://online-backend-8khb.onrender.com/api/admin/employees/${employeeId}/resend`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("Invitation resent successfully!");
    } catch (err) { alert(err.response?.data?.message || "Resend failed."); }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://online-backend-8khb.onrender.com/api/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      if (activeSection === "reports") fetchReports();
    } catch (err) { alert("Delete failed."); }
  };

  const assignComplaint = async (complaintId, employeeId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`https://online-backend-8khb.onrender.com/api/complaints/${complaintId}/assign`, { employeeId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert("Assignment failed."); }
  };

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const stats = useMemo(() => {
    const sc = complaints || [];
    return {
      total: sc.length,
      pending: sc.filter(c => c.status === "Pending").length,
      inProgress: sc.filter(c => c.status === "In Progress").length,
      resolved: sc.filter(c => c.status === "Resolved").length,
      categories: {
        Water: sc.filter(c => c.category === "Water").length,
        Electricity: sc.filter(c => c.category === "Electricity").length,
        Waste: sc.filter(c => c.category === "Waste").length,
        Roads: sc.filter(c => c.category === "Roads").length,
      }
    };
  }, [complaints]);

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r bg-slate-950 border-slate-800 shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg"><FaUserShield size={20} /></div>
            <span className="font-black text-2xl tracking-tighter uppercase text-white">FixIt <span className="text-indigo-400 font-medium">Pro</span></span>
          </div>
          <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}><FaTimes /></button>
        </div>
        <nav className="flex-1 px-6 space-y-3 mt-4">
          <SidebarItem icon={<FaHome />} label="Overview" active={activeSection === "dashboard"} onClick={() => {setActiveSection("dashboard"); setIsSidebarOpen(false)}} />
          <SidebarItem icon={<FaUserTie />} label="Team Setup" active={activeSection === "team"} onClick={() => {setActiveSection("team"); setIsSidebarOpen(false)}} />
          <SidebarItem icon={<FaChartPie />} label="Analytics" active={activeSection === "analytics"} onClick={() => {setActiveSection("analytics"); setIsSidebarOpen(false)}} />
          <SidebarItem icon={<FaArchive />} label="History Archive" active={activeSection === "archive"} onClick={() => {setActiveSection("archive"); setIsSidebarOpen(false)}} />
          <SidebarItem icon={<FaFileAlt />} label="System Reports" active={activeSection === "reports"} onClick={() => {setActiveSection("reports"); setIsSidebarOpen(false)}} />
        </nav>
        <div className="p-8 border-t border-slate-900">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/profile")}>
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 overflow-hidden bg-slate-800">
               {admin.avatar ? <img src={admin.avatar} alt="admin" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-indigo-400">{admin.name.charAt(0)}</div>}
            </div>
            <div><p className="text-xs font-black text-white">{admin.name}</p><p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Administrator</p></div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className={`h-24 flex items-center justify-between px-10 border-b transition-all ${darkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}><FaBars size={20} /></button>
            <h2 className="text-3xl font-black tracking-tighter capitalize">{activeSection.replace("-", " ")}</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className={`p-3 rounded-2xl transition-all ${darkMode ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-slate-500"}`}>
              {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
            </button>
            <div className="relative" ref={dropdownRef}>
              <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-4 cursor-pointer p-2 rounded-2xl hover:bg-slate-500/5 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg border-2 border-white dark:border-slate-800 overflow-hidden">
                  {admin.avatar ? <img src={admin.avatar} alt="Admin" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-white">{admin.name.charAt(0)}</div>}
                </div>
              </div>
              {showProfileMenu && (
                <div className={`absolute right-0 mt-4 w-64 rounded-3xl shadow-2xl border p-3 z-50 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"}`}>
                  <div className="px-4 py-3 border-b border-slate-500/10 mb-2">
                    <p className="font-black text-sm">{admin.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{admin.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-sm font-bold"><FaUserCircle /> My Profile</Link>
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-bold text-red-500 mt-1"><FaSignOutAlt /> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          
          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard title="Total Tickets" value={stats.total} icon={<FaClipboardList className="text-indigo-500" />} color="border-l-indigo-500" />
                <StatCard title="Pending" value={stats.pending} icon={<FaHourglassHalf className="text-amber-500" />} color="border-l-amber-500" />
                <StatCard title="In Progress" value={stats.inProgress} icon={<FaSpinner className="text-blue-500 animate-spin" />} color="border-l-blue-500" />
                <StatCard title="Resolved" value={stats.resolved} icon={<FaCheckCircle className="text-emerald-500" />} color="border-l-emerald-500" />
              </div>
              <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <div className="p-8 border-b border-slate-800/10"><h3 className="font-black uppercase text-xs tracking-widest text-indigo-500">Active Duty Queue</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={`text-[10px] uppercase font-black tracking-widest border-b ${darkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"}`}>
                      <tr><th className="px-8 py-5">Incident</th><th className="px-8 py-5">Assigned To</th><th className="px-8 py-5">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/5">
                      {complaints.filter(c => c.status !== "Resolved").map(c => (
                        <tr key={c._id} className="hover:bg-indigo-500/5">
                          <td className="px-8 py-6 max-w-md"><p className="font-black text-sm mb-1">{c.title}</p><p className="text-[11px] italic text-slate-500">"{c.description}"</p></td>
                          <td className="px-8 py-6">
                            <select onChange={(e) => assignComplaint(c._id, e.target.value)} value={c.assignedEmployee?._id || ""} className={`border rounded-xl px-4 py-2 text-xs font-bold ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                              <option value="">Choose Staff...</option>
                              {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                            </select>
                          </td>
                          <td className="px-8 py-6"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${c.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TEAM SETUP */}
          {activeSection === "team" && (
            <div className="space-y-10">
              <div className={`p-10 rounded-[3rem] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <h3 className="text-xl font-black mb-8 flex items-center gap-4 text-indigo-500 uppercase tracking-tighter"><FaUserPlus/> Staff Onboarding</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormInput placeholder="Full Name" value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} darkMode={darkMode} />
                  <FormInput placeholder="Email Address" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} darkMode={darkMode} />
                  <select value={inviteForm.department} onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})} className={`p-4 rounded-2xl text-sm font-bold border outline-none ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <option value="">Department...</option>
                    <option value="Water">Water</option><option value="Electricity">Electricity</option><option value="Waste">Waste</option><option value="Roads">Roads</option>
                  </select>
                  <button onClick={handleInviteEmployee} className="bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest shadow-xl">Invite User</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {employees.map(emp => (
                  <div key={emp._id} className={`p-8 rounded-[2rem] border transition-transform hover:-translate-y-1 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xl">{emp.name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-sm flex items-center gap-2">{emp.name} {!emp.isActive && <span className="bg-amber-500/10 text-amber-500 text-[8px] px-2 py-0.5 rounded-full uppercase">Pending</span>}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{emp.department}</p>
                      </div>
                    </div>
                    {!emp.isActive ? (
                      <button onClick={() => handleResendInvite(emp._id)} className="w-full py-3 rounded-xl bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"><FaEnvelope /> Resend Invite</button>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-emerald-500/5 text-emerald-500 text-[10px] font-black uppercase text-center">Active Staff</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeSection === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <ChartWrapper title="Resolution Distribution">
                <Doughnut options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }} data={{ labels: ['Pending', 'Progress', 'Resolved'], datasets: [{ data: [stats.pending, stats.inProgress, stats.resolved], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'], borderWidth: 0 }] }} />
              </ChartWrapper>
              <ChartWrapper title="Workload by Dept">
                <Bar options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={{ labels: ['Water', 'Elec', 'Waste', 'Roads'], datasets: [{ data: [stats.categories.Water, stats.categories.Electricity, stats.categories.Waste, stats.categories.Roads], backgroundColor: '#6366f1', borderRadius: 12 }] }} />
              </ChartWrapper>
            </div>
          )}
          
          {/* ARCHIVE SECTION */}
          {activeSection === "archive" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <FaHistory className="text-emerald-500" /> Resolution Archive
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                    Permanently closed and verified tickets
                  </p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  {stats.resolved} Records Secured
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {complaints.filter(c => c.status === "Resolved").length > 0 ? (
                  complaints.filter(c => c.status === "Resolved").map(c => (
                    <div key={c._id} className={`group p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:shadow-emerald-500/5 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                            <FaCheckCircle size={20} />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md">Verified Closed</span>
                            <h4 className="font-black text-lg tracking-tight mt-1">{c.title}</h4>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteComplaint(c._id)} 
                          className="p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>

                      <div className={`p-5 rounded-2xl mb-6 text-sm italic leading-relaxed ${darkMode ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-600"}`}>
                        "{c.description}"
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-500/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                            {c.assignedEmployee?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Resolved By</p>
                            <p className="text-xs font-bold text-indigo-500">{c.assignedEmployee?.name || "System"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Completion Date</p>
                          <p className="text-xs font-bold">{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-500/10 rounded-[3rem]">
                    <FaArchive size={40} className="mx-auto text-slate-500/20 mb-4" />
                    <p className="font-black text-slate-500 uppercase text-xs tracking-widest">No archived records found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORTS SECTION */}
          {activeSection === "reports" && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter">System Reports</h2>
                <div className="relative w-96">
                  <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search..." className={`w-full pl-12 pr-6 py-4 rounded-2xl border outline-none ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} />
                </div>
              </div>
              <div className={`rounded-[2.5rem] border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] uppercase font-black border-b text-slate-400">
                      <tr><th className="px-8 py-6">Title</th><th className="px-8 py-6">Staff</th><th className="px-8 py-6">Date</th><th className="px-8 py-6 text-center">Actions</th><th className="px-8 py-6 text-right">Delete</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/5">
                      {reports.filter(r => r.title?.toLowerCase().includes(reportSearch.toLowerCase())).map((report) => (
                        <tr key={report._id} className="hover:bg-indigo-500/5 transition-colors group">
                          <td className="px-8 py-6"><div className="flex items-center gap-4"><FaFileAlt className="text-indigo-500"/><span className="font-black text-sm">{report.title}</span></div></td>
                          <td className="px-8 py-6 text-xs font-bold text-indigo-600">{getStaffName(report)}</td>
                          <td className="px-8 py-6 text-xs text-slate-500">
                            {report.updatedAt || report.createdAt ? 
                                new Date(report.updatedAt || report.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : "N/A"}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setViewingReport(report)} className="bg-slate-500/10 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-500/20">View</button>
                              <button onClick={() => handlePrint(report)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700">PDF</button>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right"><button onClick={() => handleDeleteComplaint(report._id)} className="text-slate-400 hover:text-red-500"><FaTrashAlt/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* VIEW REPORT MODAL */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-[3rem] p-10 relative shadow-2xl animate-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
            <button onClick={() => setViewingReport(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={24}/></button>
            <div className="space-y-6">
                <div><h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Official Incident Record</h3><h2 className="text-3xl font-black tracking-tighter">{viewingReport.title}</h2></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'border-slate-800' : 'bg-slate-50 border-slate-100'}`}><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Lead Technician</p><p className="font-bold text-sm text-indigo-500">{getStaffName(viewingReport)}</p></div>
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'border-slate-800' : 'bg-slate-50 border-slate-100'}`}><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Resolution Date</p><p className="font-bold text-sm">
                    {viewingReport.updatedAt || viewingReport.createdAt ? new Date(viewingReport.updatedAt || viewingReport.createdAt).toLocaleDateString() : "N/A"}
                  </p></div>
                </div>
                <div><p className="text-[9px] font-black text-slate-500 uppercase mb-3">Resolution Details</p><div className={`p-6 rounded-3xl min-h-[150px] text-sm leading-relaxed ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-700'}`}>{viewingReport.description || "No specific notes provided."}</div></div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => handlePrint(viewingReport)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"><FaPrint /> Export to PDF</button>
                  <button onClick={() => setViewingReport(null)} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Close Viewer</button>
                </div>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-sm transition-all ${active ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"}`}>{icon} {label}</button>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-[2rem] border-l-4 ${color} bg-white dark:bg-slate-900 border-y border-r border-slate-100 dark:border-slate-800`}>
    <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black uppercase text-slate-500">{title}</span>{icon}</div>
    <div className="text-3xl font-black tracking-tighter">{value}</div>
  </div>
);

const ChartWrapper = ({ title, children }) => (
  <div className="p-8 rounded-[2.5rem] border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 h-[400px] flex flex-col"><h3 className="text-[10px] font-black text-indigo-500 uppercase mb-6">{title}</h3><div className="flex-1 relative">{children}</div></div>
);

const FormInput = ({ placeholder, value, onChange, darkMode }) => (
  <input type="text" placeholder={placeholder} value={value} onChange={onChange} className={`p-4 rounded-2xl text-sm font-bold border outline-none ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
);

export default AdminDashboard;