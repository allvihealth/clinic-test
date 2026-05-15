import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, ExternalLink, Activity, Search, ShieldCheck, 
  Trash2, Loader2, LayoutDashboard, ClipboardList, TrendingUp 
} from 'lucide-react';

// Allvi Brand Palette
const COLORS = {
  darkTeal: '#0D5C6E',
  midTeal: '#1A7A8A',
  lightTeal: '#D6EDF1',
  amber: '#B45309',
};

const AdminPortal = () => {
    const [view, setView] = useState('LOGIN'); // LOGIN, DASHBOARD
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);
    const navigate = useNavigate();

    // Base URL configuration from your code
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : import.meta.env.VITE_SERVER_URL;

    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/patient/admin/patients`);
            if (res.data.success) {
                setPatients(res.data.patients);
            }
        } catch (err) {
            console.error("Admin Fetch Error:", err);
            // Fallback for pilot demo if API is unreachable
            setPatients([{
                id: 'AMD001RM',
                age: 34,
                gender: 'F',
                condition: "Hashimoto's Thyroiditis",
                enrolled: 'Feb 9, 2026',
                streak: '77 days',
                lastActivity: 'Today',
                status: 'Amber'
            }]);
        }
    };

    useEffect(() => {
        if (view === 'DASHBOARD') fetchPatients();
    }, [view]);

    const handleDelete = async (patientId) => {
        const confirmDelete = window.confirm(`CRITICAL: Are you sure you want to delete all records for ${patientId}?`);
        if (confirmDelete) {
            setIsDeleting(patientId);
            try {
                const res = await axios.delete(`${baseURL}/api/patient/admin/patients/${patientId}`);
                if (res.data.success) {
                    setPatients(patients.filter(p => p.id !== patientId));
                }
            } catch (err) {
                console.error("Delete Error:", err);
                alert("Failed to delete patient records.");
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const filteredPatients = patients.filter(p => 
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 1. LOGIN SCREEN
    if (view === 'LOGIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
                    <h1 style={{ color: COLORS.darkTeal }} className="text-4xl font-black tracking-tighter mb-2">ALLVI</h1>
                    <p className="text-slate-400 font-medium mb-8">Clinic Partner Portal</p>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setView('DASHBOARD'); }}>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Email" type="email" required />
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Password" type="password" required />
                        <button type="submit" style={{ backgroundColor: COLORS.darkTeal }} className="w-full py-4 text-white font-bold rounded-2xl shadow-lg hover:opacity-90">
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header / Nav */}
            <nav style={{ backgroundColor: COLORS.darkTeal }} className="text-white p-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <span className="text-2xl font-black tracking-tighter">ALLVI</span>
                        <div className="hidden md:flex gap-4 text-xs font-bold uppercase tracking-widest opacity-70">
                            <span>Clinical Oversight</span>
                        </div>
                    </div>
                    <button onClick={() => setView('LOGIN')} className="text-xs font-bold border border-white/30 px-4 py-2 rounded-full hover:bg-white/10 transition-all">Logout</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-10">
                
                {/* 2. EXECUTIVE VIEW (Dynamic Count) */}
                <div className="flex items-center gap-2 mb-6">
                    <LayoutDashboard size={20} style={{ color: COLORS.midTeal }} />
                    <h2 className="text-xl font-bold text-slate-800">Executive Snapshot</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Patients Enrolled" value={patients.length} sub="Managed panel size" />
                    <StatCard label="Tracking Compliance" value="100%" sub="Avg. across panel" />
                    
                    {/* RISK STATUS CARD (Visual Amber) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden ring-2 ring-[#B45309]/10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Status</p>
                        <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-[#B45309]">AMBER</h4>
                            <AlertTriangle size={20} className="text-[#B45309]" />
                        </div>
                        <p className="text-[10px] font-bold text-[#B45309]/70 mt-1 uppercase">One active flag • Moderate</p>
                        <div className="absolute top-0 right-0 w-1.5 h-full" style={{ backgroundColor: COLORS.amber }}></div>
                    </div>

                    <StatCard label="Avg Energy" value="7.8/10" sub="↑ From 5.0 at Week 1" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <OutcomeBox title="Clinical Outcomes" items={[
                        { label: "Unnecessary Appointments Avoided", val: "2" },
                        { label: "Early Escalations Caught", val: "1" },
                        { label: "Medication Adherence Rate", val: "98%" }
                    ]} />
                    <OutcomeBox title="System Metrics" items={[
                        { label: "Revenue Earned (YTD)", val: "$245.00" },
                        { label: "Cost Avoided (Est.)", val: "$1,200.00" },
                        { label: "Days Tracked", val: "77" }
                    ]} />
                </div>

                {/* 3. PROGRAMME MANAGER PANEL (Your Table) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <ClipboardList size={20} style={{ color: COLORS.midTeal }} />
                        <h2 className="text-xl font-bold text-slate-800">Programme Manager</h2>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Patient ID..." 
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#1A7A8A]"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-xs font-bold uppercase tracking-widest">ID / Condition</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-widest">Streak</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-widest">Status</th>
                                <th className="p-5 text-xs font-bold uppercase tracking-widest text-right px-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPatients.length > 0 ? (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center text-[#0F4C5C]">
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[#0F4C5C]">{patient.id}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{patient.condition || "Hashimoto's"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-black text-slate-700">{patient.streak || '77 Days'}</td>
                                        <td className="p-5">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter" style={{ backgroundColor: COLORS.lightTeal, color: COLORS.amber }}>
                                                {patient.status || 'Amber'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right px-10" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end items-center gap-3">
                                                <button onClick={() => handleDelete(patient.id)} disabled={isDeleting === patient.id} className="p-2 text-slate-300 hover:text-red-600 transition-all">
                                                    {isDeleting === patient.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                                </button>
                                                <button onClick={() => navigate(`/dashboard/${patient.id}`)} className="bg-[#1F2937] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#0D5C6E] transition-all flex items-center gap-2">
                                                    View <ExternalLink size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400 font-medium">No records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

// --- SUB-COMPONENTS ---
const StatCard = ({ label, value, sub }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl font-black text-[#0D5C6E]">{value}</h4>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{sub}</p>
    </div>
);

const OutcomeBox = ({ title, items }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">{title}</h3>
        <div className="space-y-4">
            {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <span className="text-sm font-bold text-slate-900">{item.val}</span>
                </div>
            ))}
        </div>
    </div>
);

const AlertTriangle = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

export default AdminPortal;