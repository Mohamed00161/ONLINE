import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  FaArrowRight, FaShieldAlt, FaSun, FaMoon, FaBars, FaTimes,
  FaCheckCircle, FaFacebook, FaTwitter, FaLinkedin, FaGithub,
  FaSatellite, FaMicrochip, FaCrosshairs, FaGlobeAmericas, FaServer
} from "react-icons/fa";

const Home = () => {
  const { dark, setDark } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [terminalStep, setTerminalStep] = useState(0);
  
  // EXTRA: Pulse State for the Live Network Ticker
  const [livePulse, setLivePulse] = useState(1402);

  // 1. Logic: Mouse Tracking for Glow Effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 2. Logic: Navbar Scroll State
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Logic: Terminal Automation
  const terminalLogs = [
    { label: "Incoming Report", val: "Case #882-Alpha", color: "text-indigo-400" },
    { label: "Neural Analysis", val: "Pothole Detected (99.2%)", color: "text-emerald-400" },
    { label: "Geotagging", val: "40.7128° N, 74.0060° W", color: "text-amber-400" },
    { label: "Routing", val: "Dept. of Transportation", color: "text-indigo-400" },
    { label: "Priority", val: "Level 2 - Response < 4h", color: "text-rose-400" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTerminalStep((prev) => (prev + 1) % (terminalLogs.length + 1));
      setLivePulse(p => p + Math.floor(Math.random() * 3)); // Simulate live traffic
    }, 2000);
    return () => clearInterval(interval);
  }, [terminalLogs.length]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const faqs = [
    { question: "How do I report an issue?", answer: "Simply click 'Get Started' or 'File a Complaint'. You'll be prompted to upload a photo, set a location pin, and describe the problem." },
    { question: "Is my data secure?", answer: "Yes, we use high-integrity encryption and geospatial tagging to protect your identity while ensuring the report is valid." },
    { question: "How fast are issues resolved?", answer: "Our average response time is currently 42 minutes. You can track real-time progress through your dashboard." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* EXTRA FEATURE 1: TOP LIVE TICKER (THE PULSE) */}
      <div className="w-full bg-slate-900 dark:bg-black text-[9px] font-black uppercase tracking-[0.3em] py-2 px-8 flex justify-between items-center text-slate-500 border-b border-white/5 relative z-[60]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE NODES: 8,102
          </span>
          <span className="hidden md:inline">SYSTEM_LATENCY: 14ms</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-indigo-400">ACTIVE_REPAIRS: {livePulse}</span>
          <span className="hidden sm:inline">UPTIME: 99.998%</span>
        </div>
      </div>

      {/* GLOW EFFECT LAYER */}
      <div className="pointer-events-none fixed inset-0 z-30 transition duration-300 hidden lg:block" 
           style={{ background: `radial-gradient(600px at var(--mouse-x, 0) var(--mouse-y, 0), rgba(79, 70, 229, 0.08), transparent 80%)` }} 
      />

      {/* --- PREMIUM DYNAMIC NAVBAR --- */}
      <nav className={`fixed top-8 w-full z-50 transition-all duration-500 ease-in-out px-4 md:px-8 ${scrolled ? "py-4" : "py-6"}`}>
        <div className={`mx-auto max-w-7xl flex items-center justify-between transition-all duration-500 ease-in-out px-6 ${
          scrolled 
          ? "h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800" 
          : "h-20 bg-transparent"
        }`}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative bg-indigo-600 p-2 rounded-xl text-white shadow-lg group-hover:rotate-[15deg] transition-transform duration-300">
              <FaShieldAlt size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none">FixIt.</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Infrastructure</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#telemetry">Telemetry</NavLink>
              <NavLink href="#faq">Support</NavLink>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-2" />
              <NavLink href="/login" isLink>Log In</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDark(!dark)} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-90">
              {dark ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
            <Link to="/signup" className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all">
              File Issue <FaArrowRight size={10} />
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-24 left-4 right-4 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 md:hidden z-40">
              <div className="flex flex-col gap-6 font-black uppercase tracking-widest text-xs">
                <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
                <a href="#faq" onClick={() => setMobileOpen(false)}>Support</a>
                <Link to="/signup" className="bg-indigo-600 text-white text-center py-4 rounded-2xl">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-60 pb-20 flex items-center">
        <div className="absolute inset-0 z-0">
          <img src="/images/city.jpg" alt="City" className="w-full h-full object-cover grayscale-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/20 via-slate-50/40 to-slate-50 dark:from-slate-950/40 dark:via-slate-950/60 dark:to-slate-950" />
        </div>
        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.span variants={fadeInUp} className="inline-block py-1 px-3 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-600/20">Direct Community Impact</motion.span>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-tight">Modernizing <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Urban Solutions.</span></motion.h1>
            <motion.p variants={fadeInUp} className="text-lg text-slate-700 dark:text-slate-300 mb-10 max-w-2xl mx-auto font-medium">A high-fidelity platform for rapid response and departmental accountability.</motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">File a Complaint <FaArrowRight size={14} /></Link>
              <Link to="/login" className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/30 px-8 py-4 rounded-xl font-bold">Track Status</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative z-20 -mt-10 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-slate-800 shadow-2xl">
          <StatItem label="Active Users" value="24.8k" />
          <StatItem label="Resolved Today" value="1,204" />
          <StatItem label="Avg Response" value="42m" />
          <StatItem label="Satisfaction" value="98%" />
        </div>
      </section>

      {/* EXTRA FEATURE 2: SYSTEM ARCHITECTURE VISUALIZER */}
      <section className="py-24 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <ArchitectureCard 
            icon={<FaGlobeAmericas className="text-blue-500"/>} 
            title="Edge Intelligence" 
            detail="Processing data at the street level for instant categorization and privacy scrubbing." 
          />
          <ArchitectureCard 
            icon={<FaServer className="text-indigo-500"/>} 
            title="Redundant Core" 
            detail="Distributed infrastructure ensures zero downtime during high-load city emergencies." 
          />
          <ArchitectureCard 
            icon={<FaShieldAlt className="text-emerald-500"/>} 
            title="Trust Protocol" 
            detail="End-to-end encryption for citizen reports and immutable departmental audit trails." 
          />
        </div>
      </section>

      {/* NEURAL DISPATCHER (EXTRA SECTION) */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Proprietary Routing Logic
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 leading-[1.1]">Smart Routing <br /> <span className="text-slate-400">Zero Bureaucracy.</span></h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed">Our Neural Dispatcher identifies report types via computer vision and routes them to field crew tablets in seconds.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-2xl font-black text-indigo-600 mb-1">0.4s</div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dispatch Time</div>
                </div>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-2xl font-black text-emerald-500 mb-1">100%</div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Accuracy</div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="relative z-10 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-mono min-h-[360px]">
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-800">
                  <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500/50" /><div className="w-2 h-2 rounded-full bg-amber-500/50" /><div className="w-2 h-2 rounded-full bg-emerald-500/50" /></div>
                  <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">system_log_v2.0</div>
                </div>
                <div className="p-8 space-y-4">
                  {terminalLogs.map((log, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: terminalStep > i ? 1 : 0, x: terminalStep > i ? 0 : -10 }} className="flex items-start gap-4 text-xs">
                      <span className="text-slate-600">[{i+1}]</span>
                      <span className="text-slate-400 uppercase font-bold w-24">{log.label}:</span>
                      <span className={`${log.color} font-bold`}>{log.val}</span>
                    </motion.div>
                  ))}
                  {terminalStep === terminalLogs.length && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-6 border-t border-slate-800/50 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                      &gt; Case dispatched successfully to crew #14
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXTRA FEATURE 3: GEOSPATIAL TELEMETRY SCANNER */}
      <section id="telemetry" className="py-24 bg-white dark:bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tighter mb-4">Verification of Fix</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every repair is logged with geospatial telemetry and a unique hardware-signed hash to ensure zero fraud.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ResolutionScanner 
              caseId="TX-9920-F" 
              location="District 4, Sector 7" 
              lat="29.7604° N" 
              long="95.3698° W" 
            />
            <div className="space-y-8">
              <TelemetryFeature icon={<FaSatellite />} title="Satellite Verification" desc="Automated fly-over checks confirm large-scale infrastructure changes." />
              <TelemetryFeature icon={<FaMicrochip />} title="Hardware-Signed Logs" desc="Crew tablets use secure enclaves to sign-off on repairs." />
              <TelemetryFeature icon={<FaCrosshairs />} title="0.5m Precision" desc="High-precision GPS tagging ensures exact alignment." />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-black tracking-tighter mb-16">From Report to Resolution.</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <ProcessStep number="01" title="Snap & Tag" desc="Capture the issue and let GPS do the heavy lifting." />
            <ProcessStep number="02" title="Automated Routing" desc="Instantly sent to the correct city department." />
            <ProcessStep number="03" title="Staff Action" desc="Track personnel as they arrive on-site." />
            <ProcessStep number="04" title="Verified Fix" desc="Receive a photo confirmation of the repair." />
          </div>
        </div>
      </section>

      {/* RESOLUTION SHOWCASE */}
      <section className="py-24 bg-slate-100 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">Proven Results</p>
              <h2 className="text-4xl font-black tracking-tighter">Real Impact, Real Fast.</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ComparisonCard 
              category="Roads" 
              title="Main St. Pothole" 
              time="4h 12m" 
              src="/images/road.jpg" 
            />
            <ComparisonCard 
              category="Electricity" 
              title="Park Lighting" 
              time="1h 45m" 
              src="/images/electricity.jpeg" 
            />
            <ComparisonCard 
              category="Waste" 
              title="Illegal Dumping" 
              time="6h 30m" 
              src="/images/waste.jpeg" 
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
 {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-stretch"> {/* Changed items-center to items-stretch */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">Support</p>
            <h2 className="text-4xl font-black tracking-tighter mb-8">Frequently Asked Questions.</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="flex justify-between items-center w-full py-2 text-left group">
                    <span className={`font-bold transition-colors ${openIndex === index ? 'text-indigo-600' : 'group-hover:text-indigo-500'}`}>{faq.question}</span>
                    <span className={`transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>↓</span>
                  </button>
                  {openIndex === index && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-500 mt-2 leading-relaxed">{faq.answer}</motion.p>}
                </div>
              ))}
            </div>
          </div>
          
          {/* Optimized Image Container */}
          <div className="w-full lg:w-1/2 min-h-[400px] lg:min-h-full">
            <img 
              src="/images/plan.jpeg" 
              className="w-full h-full object-cover rounded-3xl shadow-2xl grayscale-[0.2]" 
              alt="Support" 
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div className="space-y-6">
              <div className="text-2xl font-black tracking-tighter">FixIt.</div>
              <p className="text-slate-400 text-sm">Empowering citizens to rebuild their cities through high-integrity technology.</p>
              <div className="flex gap-4">
                <SocialIcon icon={<FaFacebook />} /> <SocialIcon icon={<FaTwitter />} /> <SocialIcon icon={<FaLinkedin />} /> <SocialIcon icon={<FaGithub />} />
              </div>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">How it works</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Status Map</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400 mb-6">Newsletter</h4>
              <div className="flex bg-slate-800 p-2 rounded-xl">
                <input type="email" placeholder="Email address" className="bg-transparent px-4 py-2 outline-none w-full text-sm" />
                <button className="bg-indigo-600 p-3 rounded-lg"><FaArrowRight size={12} /></button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center uppercase font-black tracking-widest">
            <span>© {new Date().getFullYear()} FixIt Infrastructure</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* --- HELPER COMPONENTS --- */

const NavLink = ({ href, children, isLink = false }) => {
  const content = (
    <span className="relative px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors group">
      {children}
      <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
    </span>
  );
  return isLink ? <Link to={href}>{content}</Link> : <a href={href}>{content}</a>;
};

const ArchitectureCard = ({ icon, title, detail }) => (
  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="font-black text-lg mb-2">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed">{detail}</p>
  </div>
);

const ResolutionScanner = ({ caseId, location, lat, long }) => {
  const [scanPos, setScanPos] = useState(50);
  return (
    <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 group cursor-crosshair"
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           setScanPos(((e.clientX - rect.left) / rect.width) * 100);
         }}>
      <div className="aspect-[4/3] relative">
        <img src="/images/city.jpg" className="absolute inset-0 w-full h-full object-cover filter grayscale" alt="Before" />
        <div className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-indigo-500 transition-all duration-75"
             style={{ width: `${scanPos}%` }}>
          <img src="/images/city.jpg" className="absolute inset-0 h-full w-[400px] md:w-[800px] object-cover filter saturate-150" alt="After" />
        </div>
        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white font-mono text-[9px] pointer-events-none">
          <div className="text-indigo-400 mb-2 font-bold">TELEMETRY: ACTIVE</div>
          <div className="grid grid-cols-2 gap-x-4">
            <span>CASE:</span> <span>{caseId}</span>
            <span>LAT:</span> <span>{lat}</span>
          </div>
        </div>
        <div className="absolute inset-y-0 w-1 bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.8)] pointer-events-none" style={{ left: `${scanPos}%` }} />
      </div>
    </div>
  );
};

const TelemetryFeature = ({ icon, title, desc }) => (
  <div className="flex gap-6 group">
    <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="text-left">
      <h4 className="font-black text-lg mb-1">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="text-center">
    <p className="text-2xl font-black">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

const ProcessStep = ({ number, title, desc }) => (
  <div className="relative group">
    <div className="text-6xl font-black text-slate-100 dark:text-slate-900 absolute -top-8 left-1/2 -translate-x-1/2 transition-colors group-hover:text-indigo-500/10">{number}</div>
    <div className="relative z-10">
      <h4 className="font-black mb-2">{title}</h4>
      <p className="text-xs text-slate-500 font-medium">{desc}</p>
    </div>
  </div>
);

const ComparisonCard = ({ category, title, time, src }) => (
  <div className="group bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg hover:-translate-y-2 transition-all">
    <div className="aspect-video bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
      <img src={src} className="w-full h-full object-cover" alt={title} />
      <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Case Resolved</div>
    </div>
    <div className="p-6">
      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">{category}</p>
      <h4 className="font-black text-lg mb-4">{title}</h4>
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400">
        <span>Resolution:</span>
        <span className="text-slate-900 dark:text-white">{time}</span>
      </div>
    </div>
  </div>
);

const SocialIcon = ({ icon }) => (
  <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all">
    {icon}
  </a>
);

export default Home;