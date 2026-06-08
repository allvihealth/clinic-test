import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WhatsNextCard from './WhatsNextCard';

const getTrafficLightClass = (status) => {
    if (status === 'green' || status === 'optimal') return 'gr';
    if (status === 'amber' || status === 'suboptimal') return 'am';
    if (status === 'red' || status === 'out_of_range') return 'red';
    return 'gr';
};

const getTimelineBadgeStyles = (styleKey) => {
    if (styleKey === 'w') return { background: '#FDF3E7', color: '#C97B2E' };
    if (styleKey === 'o') return { background: '#E8F4F7', color: '#0F4C5C' };
    return { background: '#EAF5EE', color: '#2D6A4F' };
};

const WeeklyReport = ({
    computedWeekNumber,
    totalDaysTracked,
    data,
    dynamicEnergy,
    dynamicMood,
    dynamicSleep,
    dynamicStress,
    latestSymptomRow,
    historicalSymptomRow,
    evaluateTrend
}) => {
    const [clinicalFeed, setClinicalFeed] = useState([]);
    const [patternsFeed, setPatternsFeed] = useState([]);
    const [whatsNextFeed, setWhatsNextFeed] = useState([]);
    const [loadingFeed, setLoadingFeed] = useState(false);

    // Fallback patient tracking index extraction checks
    const activePatientId = data?.labs?.[0]?.patient_id || 'Allvi-6170';

    useEffect(() => {
        const fetchWeeklyReportDetails = async () => {
            try {
                setLoadingFeed(true);
                const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                    ? 'http://127.0.0.1:5000'
                    : import.meta.env.VITE_SERVER_URL || '';

                const token = localStorage.getItem('allvi_auth_token');
                const res = await axios.get(`${baseURL}/api/patient/weekly-report/${activePatientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.data?.success) {
                    setClinicalFeed(res.data.clinical_monitoring || []);
                    setPatternsFeed(res.data.weekly_patterns || []);
                    setWhatsNextFeed(res.data.whats_next || []);
                }
            } catch (error) {
                console.error("❌ Network layer dashboard exception:", error);
            } finally {
                setLoadingFeed(false);
            }
        };

        if (activePatientId) fetchWeeklyReportDetails();
    }, [activePatientId]);

    return (
        <div style={{ animation: 'fadeIn 0.15s ease-in-out' }}>
            {/* PAGE HEADER */}
            <div className="ph">
                <h1 className="ph-title">Week {computedWeekNumber} Report</h1>
                <p className="ph-sub">
                    {data.labs?.[0]?.test_date
                        ? `Data Records Window • Profile Baseline Updated ${new Date(data.labs[0].test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : `April 22–26, 2026 · Day ${Math.max(1, totalDaysTracked - 12)}–${totalDaysTracked} on Levothyroxine 25mcg`
                    }
                </p>
            </div>

            {/* HERO HIGHLIGHT PANEL */}
            <div className="rh" style={{ background: '#0F4C5C', color: '#F7F1E8', padding: '28px', borderRadius: '12px', marginBottom: '24px' }}>
                <h2 className="rw" style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 600, color: '#F7F1E8', marginBottom: '4px' }}>
                    Week {computedWeekNumber}
                </h2>
                <p className="rm" style={{ fontSize: '13px', color: 'rgba(247,241,232,0.7)', marginBottom: '16px' }}>
                    {totalDaysTracked} days tracked
                </p>

                <div className="rk" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicEnergy}</div>
                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Energy</div>
                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}</div>
                    </div>

                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicMood}</div>
                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Mood</div>
                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}</div>
                    </div>

                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicSleep}</div>
                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Sleep</div>
                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>{evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}</div>
                    </div>

                    <div className="rkc" style={{ background: 'rgba(247,241,232,0.1)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div className="rkv" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: '#F7F1E8' }}>{dynamicStress}</div>
                        <div className="rkl" style={{ fontSize: '11px', color: 'rgba(247,241,232,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Stress</div>
                        <div className="rkd" style={{ fontSize: '11px', marginTop: '4px', color: '#7BDCB5' }}>
                            {dynamicStress <= 1.5 && latestSymptomRow ? "↓ prog. low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                        </div>
                    </div>
                </div>
            </div>

            {/* CLINICAL MONITORING DETAILS TRACE */}
            <div className="card" style={{ marginBottom: '20px', background: '#FFFFFF', padding: '24px', borderRadius: '12px' }}>
                <div className="card-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                    Clinical Monitoring
                </div>
                {loadingFeed ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280', fontSize: '13px' }}>🔄 Processing clinical timelines...</div>
                ) : clinicalFeed.length > 0 ? (
                    clinicalFeed.map((feed, idx, arr) => {
                        const isLastItem = idx === arr.length - 1;
                        const statusClass = getTrafficLightClass(feed.status);
                        return (
                            <div key={feed.id || idx} className="dr" style={{ display: 'flex', gap: '16px', marginBottom: isLastItem ? '0px' : '20px' }}>
                                <div className={`ds ${statusClass}`} style={{ background: statusClass === 'gr' ? '#EAF5EE' : statusClass === 'am' ? '#FDF3E7' : '#FDECEA', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                                    {feed.emoji || '🟢'}
                                </div>
                                <div>
                                    <div className="dn" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                                        {feed.title}
                                        <span className={`dbadge ${statusClass}`} style={{ background: statusClass === 'gr' ? '#EAF5EE' : statusClass === 'am' ? '#FDF3E7' : '#FDECEA', color: statusClass === 'gr' ? '#2D6A4F' : statusClass === 'am' ? '#C97B2E' : '#9B2226', display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                                            {feed.badge}
                                        </span>
                                    </div>
                                    <div className="dd" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>{feed.content}</div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280' }}>No parameters recorded.</div>
                )}
            </div>

            {/* COMPLETELY DYNAMIC WEEKLY PATTERNS CARD */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-title">Week {computedWeekNumber} Patterns</div>
                {loadingFeed ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280', fontSize: '13px' }}>🔄 Tracking dynamic trends...</div>
                ) : patternsFeed.length > 0 ? (
                    patternsFeed.map((item, idx) => {
                        const isWatch = item.type === 'watch' || item.id === 'watch';
                        return (
                            <div key={idx} className={`ic ${isWatch ? 'am' : 'gr'}`} style={{ background: isWatch ? '#FDF3E7' : '#EAF5EE', borderLeft: isWatch ? '4px solid #C97B2E' : '4px solid #2D6A4F', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                <div className={`ic-tag ${isWatch ? 'am' : 'gr'}`} style={{ fontSize: '10px', fontWeight: 700, color: isWatch ? '#C97B2E' : '#2D6A4F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    {item.tag_text || (isWatch ? '⚠ Watch' : '✓ Milestone')}
                                </div>
                                <div className="ic-title" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>{item.title}</div>
                                <div className="ic-body" style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>{item.content}</div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#6B7280', fontSize: '14px' }}>No patterns discovered for this timeline loop.</div>
                )}
            </div>

            {/* COMPLETELY DYNAMIC WHAT'S NEXT CARD */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <WhatsNextCard
                    whatsNextFeed={whatsNextFeed}
                    loading={loadingFeed}
                    onActionClick={(target) => {
                        if (target === 'advocacy') setCurrentScreen('advocacy');
                        if (target === 'appointment') setIsModalOpen(true);
                        if (target === 'insights') setCurrentScreen('insights');
                    }}
                />

            </div>

            <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.6', padding: '12px', background: '#EDE7DB', borderRadius: '8px' }}>
                This report is for informational support only and does not constitute medical advice, a diagnosis, or a prescription. Allvi accepts no clinical liability for decisions made based on this report.
            </div>
        </div>
    );
};

export default WeeklyReport;