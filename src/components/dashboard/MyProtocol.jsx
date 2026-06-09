import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyProtocol = ({ data = {}, totalDaysTracked = 0 }) => {
    const [activeTab, setActiveTab] = useState('nut');
    const [loading, setLoading] = useState(true);
    const [checkedItems, setCheckedItems] = useState([]);
    
    // 🚀 Directly sync database values on initialization
    const [dbMetadata, setDbMetadata] = useState({
        diagnosis: "Hashimoto's Thyroiditis",
        symptoms: ["Constipation", "Mood", "Cold intolerance"],
        goals: "Improve GI · Slow autoimmune attack · Feel warmer"
    });
    const [aiProtocol, setAiProtocol] = useState(null);

    const activePatientId = data?.labs?.[0]?.patient_id || 'Allvi-6170';

    useEffect(() => {
        const fetchProtocolDetails = async () => {
            try {
                setLoading(true);
                const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://127.0.0.1:5000'
                    : import.meta.env.VITE_SERVER_URL || '';

                const token = localStorage.getItem('allvi_auth_token');
                const res = await axios.get(`${baseURL}/api/patient/protocol-comprehensive/${activePatientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.data?.success) {
                    // ✅ Overwrite state with exact backend table responses
                    setDbMetadata({
                        diagnosis: res.data.diagnosis,
                        symptoms: res.data.symptoms,
                        goals: res.data.goals
                    });
                    
                    if (res.data.protocol) {
                        setAiProtocol(res.data.protocol);
                    }
                }
            } catch (error) {
                console.error("❌ Error loading dynamic protocol package matrices:", error);
            } finally {
                setLoading(false);
            }
        };

        if (activePatientId) fetchProtocolDetails();
    }, [activePatientId]);

    const toggleCheckItem = (itemKey) => {
        setCheckedItems(prev => prev.includes(itemKey) ? prev.filter(i => i !== itemKey) : [...prev, itemKey]);
    };

    return (
        <div style={{ animation: 'fadeIn 0.15s ease-in-out' }}>
            {/* PAGE HEADER ACTION PANEL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div className="ph-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 600, color: '#1F2937' }}>My Protocol</div>
                    <div className="ph-sub" style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                        Personalised Lifestyle Support · Hashimoto's · Delivered Week 2 · Updated May 2026
                    </div>
                </div>
                <button className="btn-primary" style={{ background: '#0F4C5C', color: '#F7F1E8', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>⬇ Download PDF</button>
            </div>

            {/* 🚀 DIRECT DATABASE HERO STRIP BANNER */}
            <div className="card" style={{ marginBottom: '22px', background: '#0F4C5C', border: 'none', color: '#F7F1E8', padding: '24px', borderRadius: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Diagnosis</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{dbMetadata.diagnosis}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(247,241,232,0.7)', marginTop: '2px' }}>Diagnosed Jan 2026</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Top Symptoms at Start</div>
                        <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                            {Array.isArray(dbMetadata.symptoms) && dbMetadata.symptoms.length > 0 
                                ? dbMetadata.symptoms.join(' · ') 
                                : "No initial symptoms logged."}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)', marginBottom: '6px' }}>Primary Goals</div>
                        <div style={{ fontSize: '13px', lineHeight: 1.4 }}>{dbMetadata.goals || "No active goals specified."}</div>
                    </div>
                </div>
            </div>

            {/* PRIMARY WORKSPACE SELECTION TABS */}
            <div className="card" style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="pt-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #EDE7DB', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'nut', label: '🥗 Nutrition' },
                        { id: 'sup', label: '💊 Supplements' },
                        { id: 'exc', label: '🏃 Exercise' },
                        { id: 'slp', label: '🌙 Sleep' },
                        { id: 'str', label: '🍃 Stress' },
                        { id: 'chk', label: '✅ Action Plan' }
                    ].map(tab => (
                        <div 
                            key={tab.id} 
                            className={`pt-tab ${activeTab === tab.id ? 'on' : ''}`} 
                            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: activeTab === tab.id ? '#E8F4F7' : 'transparent', color: activeTab === tab.id ? '#0F4C5C' : '#6B7280' }}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* 🛡️ INLINE LOADING GATE (Only blocks the tab row content below) */}
                {loading || !aiProtocol ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                        🔄 Synchronizing dynamic lifestyle parameters with backend AI engine...
                    </div>
                ) : (
                    <>
                        {/* 🥗 TAB 1: NUTRITION */}
                        {activeTab === 'nut' && aiProtocol.nutrition && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.nutrition.compliance_header}</p>
                                {aiProtocol.nutrition.protocols?.map((p, i) => (
                                    <div key={i} className="pr" style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '14px', background: '#FDF3E7', borderRadius: '8px', borderLeft: '4px solid #C97B2E' }}>
                                        <div style={{ fontSize: '20px' }}>{p.icon || '🥗'}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{p.title}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{p.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 💊 TAB 2: SUPPLEMENTS */}
                        {activeTab === 'sup' && aiProtocol.supplements && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.supplements.header}</p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="stab" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #EDE7DB', textAlign: 'left' }}>
                                                <th style={{ padding: '10px', fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Supplement</th>
                                                <th style={{ padding: '10px', fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Dose</th>
                                                <th style={{ padding: '10px', fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>When</th>
                                                <th style={{ padding: '10px', fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>Why</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aiProtocol.supplements.rows && aiProtocol.supplements.rows.length > 0 ? (
                                                aiProtocol.supplements.rows.map((row, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #F7F1E8', background: idx % 2 === 1 ? '#F7F1E8' : 'transparent' }}>
                                                        <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{row.name}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: '13px', color: '#0F4C5C', fontWeight: 600 }}>{row.dose}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: '13px', color: '#1F2937' }}>{row.when}</td>
                                                        <td style={{ padding: '12px 10px', fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{row.strategy || row.why}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280', fontSize: '13px', fontStyle: 'italic' }}>
                                                        No active supplements mapped inside current profile database records.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {aiProtocol.supplements.warning_banner && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: '#FDF3E7', borderRadius: '8px', fontSize: '12px', color: '#C97B2E', borderLeft: '4px solid #C97B2E', lineHeight: 1.5 }}>
                                        {aiProtocol.supplements.warning_banner}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 🏃 TAB 3: EXERCISE */}
                        {activeTab === 'exc' && aiProtocol.exercise && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.exercise.header}</p>
                                {aiProtocol.exercise.protocols?.map((p, i) => (
                                    <div key={i} className="pr" style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '14px', background: '#EAF5EE', borderRadius: '8px', borderLeft: '4px solid #2D6A4F' }}>
                                        <div style={{ fontSize: '20px' }}>{p.icon || '🏃'}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{p.title}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{p.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 🌙 TAB 4: SLEEP */}
                        {activeTab === 'slp' && aiProtocol.sleep && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.sleep.header}</p>
                                {aiProtocol.sleep.protocols?.map((p, i) => (
                                    <div key={i} className="pr" style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '14px', background: '#E8F4F7', borderRadius: '8px', borderLeft: '4px solid #0F4C5C' }}>
                                        <div style={{ fontSize: '20px' }}>{p.icon || '🌙'}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{p.title}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{p.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 🍃 TAB 5: STRESS */}
                        {activeTab === 'str' && aiProtocol.stress && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.stress.header}</p>
                                {aiProtocol.stress.protocols?.map((p, i) => (
                                    <div key={i} className="pr" style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '14px', background: '#FDF3E7', borderRadius: '8px', borderLeft: '4px solid #C97B2E' }}>
                                        <div style={{ fontSize: '20px' }}>{p.icon || '🍃'}</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{p.title}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.4 }}>{p.detail}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ✅ TAB 6: ACTION PLAN */}
                        {activeTab === 'chk' && aiProtocol.action_plan && (
                            <div className="pt-content on">
                                <p style={{ fontSize: '13px', color: '#6B7280', padding: '4px 0 16px' }}>{aiProtocol.action_plan.header}</p>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#2D6A4F', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>✓ ALREADY DOING</div>
                                    {aiProtocol.action_plan.already_doing?.map((text, idx) => (
                                        <div key={idx} className="cl-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div className="cb-box done" style={{ width: '18px', height: '18px', border: '2px solid #2D6A4F', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', background: '#2D6A4F' }}>✓</div>
                                            <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>{text}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#0F4C5C', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>ONGOING — Current Protocol</div>
                                    {aiProtocol.action_plan.ongoing?.map((text, idx) => {
                                        const uniqueId = `ongoing_${idx}`;
                                        const isChecked = checkedItems.includes(uniqueId);
                                        return (
                                            <div key={idx} className="cl-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => toggleCheckItem(uniqueId)}>
                                                <div className={`cb-box ${isChecked ? 'done' : ''}`} style={{ width: '18px', height: '18px', border: '2px solid #0F4C5C', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', background: isChecked ? '#0F4C5C' : 'transparent' }}>{isChecked ? '✓' : ''}</div>
                                                <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>{text}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#C97B2E', color: 'white', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>WATCH — Discuss with Endo</div>
                                    {aiProtocol.action_plan.watch?.map((text, idx) => {
                                        const uniqueId = `watch_${idx}`;
                                        const isChecked = checkedItems.includes(uniqueId);
                                        return (
                                            <div key={idx} className="cl-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => toggleCheckItem(uniqueId)}>
                                                <div className={`cb-box ${isChecked ? 'done' : ''}`} style={{ width: '18px', height: '18px', border: '2px solid #C97B2E', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', background: isChecked ? '#C97B2E' : 'transparent' }}>{isChecked ? '✓' : ''}</div>
                                                <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 500 }}>{text}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyProtocol;