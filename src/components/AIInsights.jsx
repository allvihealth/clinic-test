import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, AlertCircle, AlertTriangle, User, Activity } from 'lucide-react';

const AIInsights = ({ patientId, intake }) => {
    const [insightsData, setInsightsData] = useState({ optimal: [], monitor: [], critical: [] });
    const [loading, setLoading] = useState(true);

    const parseInsightsText = (text) => {
        const parsed = { optimal: [], monitor: [], critical: [] };
        if (!text) return {
            optimal: ["No significant positive trends detected."],
            monitor: ["No areas of concern identified."],
            critical: ["No immediate attention needed."]
        };

        let currentSection = null;
        const lines = text.split('\n');

        lines.forEach(line => {
            const cleanLine = line.trim();
            const upper = cleanLine.toUpperCase();

            if (upper.includes('POSITIVE TRENDS')) { currentSection = 'optimal'; return; }
            if (upper.includes('AREAS OF CONCERN')) { currentSection = 'monitor'; return; }
            if (upper.includes('NEEDS ATTENTION')) { currentSection = 'critical'; return; }

            if (currentSection && cleanLine.length > 3) {
                const point = cleanLine.replace(/^[-*\d.\s]+/, '').replace(/\*\*/g, '').trim();
                if (point) parsed[currentSection].push(point);
            }
        });

        // Defensive fallbacks to ensure UI rendering
        if (!parsed.optimal.length) parsed.optimal.push("No significant positive trends detected.");
        if (!parsed.monitor.length) parsed.monitor.push("No areas of concern identified.");
        if (!parsed.critical.length) parsed.critical.push("No immediate attention needed.");

        return parsed;
    };

    useEffect(() => {
        if (!patientId) return;

        const fetchInsights = async () => {
            try {
                setLoading(true);
                const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://127.0.0.1:5000'
                    : import.meta.env.VITE_SERVER_URL;

                const token = localStorage.getItem('allvi_auth_token');

                const res = await axios.get(`${baseURL}/api/patient/insights/${patientId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.data?.success && res.data?.insights) {
                    const parsed = parseInsightsText(res.data.insights);
                    setInsightsData(parsed);
                }
            } catch (error) {
                console.error("Error fetching AI insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [patientId]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-4 w-48 bg-slate-200 rounded-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-5 rounded-2xl border h-48" />
                    ))}
                </div>
            </div>
        );
    }

    const categories = [
        { title: "Optimal / Stable", color: "bg-emerald-50 text-emerald-900 border-emerald-200", icon: <ShieldCheck className="text-emerald-600" size={24} />, points: insightsData.optimal },
        { title: "Monitor / Borderline", color: "bg-amber-50 text-amber-900 border-amber-200", icon: <AlertTriangle className="text-amber-600" size={24} />, points: insightsData.monitor },
        { title: "Requires Attention", color: "bg-rose-50 text-rose-900 border-rose-200", icon: <AlertCircle className="text-rose-600" size={24} />, points: insightsData.critical }
    ];

    return (
        <div className="space-y-6 ai-insights-container">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-2 no-print gap-4">
                <h2 className="text-xs font-black text-[#1F2937]/40 uppercase tracking-[0.25em]">Allvi AI Health Insights</h2>
                {intake?.goals && (
                    <div className="bg-[#0F4C5C]/5 text-[#0F4C5C] px-3 py-1.5 rounded-md text-[10px] font-bold border border-[#0F4C5C]/10 flex-1 md:max-w-md truncate">
                        Target: {intake.goals}
                    </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#0F4C5C] bg-[#0F4C5C]/10 px-3 py-1.5 rounded-full flex-shrink-0">
                    <User size={12} /> ID: {patientId}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat, index) => (
                    <div key={index} className={`${cat.color} p-5 rounded-2xl border print:border-[0.5pt] print:shadow-none print:bg-white shadow-sm flex flex-col h-full`} style={{ breakInside: 'avoid' }}>
                        <div className="flex items-center gap-3 mb-4">
                            {cat.icon}
                            <h3 className="font-black text-sm uppercase tracking-tight">{cat.title}</h3>
                        </div>
                        <ul className="space-y-3 flex-grow">
                            {cat.points.map((point, pIndex) => (
                                <li key={pIndex} className="text-xs font-medium leading-relaxed flex gap-2">
                                    <span className="opacity-40 mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsights;