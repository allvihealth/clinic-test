import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import Papa from 'papaparse';
import {
    Activity, FileUp, Info, Calendar, Send, X, Loader2, FlaskConical, Search, 
    ChevronDown, ChevronUp, AlertTriangle, ClipboardList, FilePlus, CheckCircle2, 
    FileText, LayoutDashboard, CheckSquare, BarChart2, BookOpen, MessageSquare, PhoneCall, Printer
} from 'lucide-react';
import AIInsights from './AIInsights';

// ─── LAB MARKER REGISTRY ───────────────────────────────────────────────────────
const MARKER_REGISTRY = {
    thyroid: {
        label: 'Thyroid',
        icon: '⊕',
        color: '#0F4C5C',
        accent: '#E8F4F7',
        markers: {
            tsh: { label: 'TSH', unit: 'mIU/L', range: [0.4, 4.0], optimal: [0.5, 2.5], note: 'Optimal for fertility: 0.5–2.5' },
            free_t3: { label: 'Free T3', unit: 'pg/mL', range: [2.3, 4.2], optimal: [3.0, 4.2], note: null },
            free_t4: { label: 'Free T4', unit: 'ng/dL', range: [0.8, 1.8], optimal: [1.1, 1.8], note: null },
            tpo_antibodies: { label: 'TPO Antibodies', unit: 'IU/mL', range: [0, 35], optimal: [0, 15], note: "Elevated suggests Hashimoto's" },
            tgab: { label: 'TgAb', unit: 'IU/mL', range: [0, 4], optimal: [0, 2], note: null },
            tsi: { label: 'TSI', unit: '%', range: [0, 140], optimal: [0, 100], note: "Elevated suggests Graves'" },
            trab: { label: 'TRAb', unit: 'IU/L', range: [0, 1.75], optimal: [0, 1.0], note: null },
        }
    },
    metabolic: {
        label: 'Metabolic / Insulin',
        icon: '◈',
        color: '#C97B2E',
        accent: '#FDF3E7',
        markers: {
            fasting_glucose: { label: 'Fasting Glucose', unit: 'mg/dL', range: [70, 99], optimal: [72, 90], note: 'Prediabetes: 100–125' },
            fasting_insulin: { label: 'Fasting Insulin', unit: 'µIU/mL', range: [2, 10], optimal: [2, 7], note: 'Optimal <7 for PCOS' },
            homa_ir: { label: 'HOMA-IR', unit: 'index', range: [0, 1.9], optimal: [0, 1.5], note: '>2.5 suggests insulin resistance' },
            hba1c: { label: 'HbA1c', unit: '%', range: [4.0, 5.6], optimal: [4.0, 5.3], note: 'Prediabetes: 5.7–6.4%' },
        }
    },
    pcos: {
        label: 'PCOS-Related',
        icon: '◎',
        color: '#7c3aed',
        accent: '#ede9fe',
        markers: {
            lh: { label: 'LH', unit: 'IU/L', range: [1, 12], optimal: [1, 7], note: 'Varies by cycle day' },
            fsh: { label: 'FSH', unit: 'IU/L', range: [1, 10], optimal: [3, 10], note: 'Day 3 reference: 3–10' },
            lh_fsh_ratio: { label: 'LH:FSH Ratio', unit: 'ratio', range: [0, 2], optimal: [0, 1.5], note: '>2 suggests PCOS' },
            total_testosterone: { label: 'Total Testosterone', unit: 'ng/dL', range: [15, 70], optimal: [15, 55], note: 'Female range' },
            free_testosterone: { label: 'Free Testosterone', unit: 'pg/mL', range: [0.1, 6.4], optimal: [0.1, 5.0], note: null },
            dhea_s: { label: 'DHEA-S', unit: 'µg/dL', range: [35, 430], optimal: [35, 300], note: 'Age-dependent' },
            shbg: { label: 'SHBG', unit: 'nmol/L', range: [18, 114], optimal: [40, 114], note: 'Low SHBG → more free androgens' },
            amh: { label: 'AMH', unit: 'ng/mL', range: [1.0, 3.5], optimal: [1.0, 3.5], note: 'High in PCOS (>3.5)' },
        }
    },
    fertility: {
        label: 'Fertility-Relevant',
        icon: '◉',
        color: '#be185d',
        accent: '#fce7f3',
        markers: {
            amh: { label: 'AMH', unit: 'ng/mL', range: [1.0, 3.5], optimal: [1.5, 3.5], note: 'Ovarian reserve marker' },
            afc: { label: 'AFC', unit: 'count', range: [8, 24], optimal: [10, 24], note: 'Antral follicle count via ultrasound' },
            day3_fsh: { label: 'Day 3 FSH', unit: 'IU/L', range: [3, 10], optimal: [3, 8], note: '>10 may suggest diminished reserve' },
            estradiol: { label: 'Estradiol', unit: 'pg/mL', range: [12, 166], optimal: [30, 80], note: 'Day 3: <80 pg/mL ideal' },
        }
    },
    inflammatory: {
        label: 'Inflammatory',
        icon: '◆',
        color: '#2D6A4F',
        accent: '#EAF5EE',
        markers: {
            crp: { label: 'CRP (hs-CRP)', unit: 'mg/L', range: [0, 1.0], optimal: [0, 0.5], note: '<1 low risk; 1–3 moderate; >3 high' },
            ferritin: { label: 'Ferritin', unit: 'ng/mL', range: [12, 150], optimal: [50, 100], note: 'Optimal for women: 50–100' },
        }
    },
    general: {
        label: 'General',
        icon: '○',
        color: '#0369a1',
        accent: '#e0f2fe',
        markers: {
            vitamin_d: { label: 'Vitamin D (25-OH)', unit: 'ng/mL', range: [30, 80], optimal: [50, 70], note: 'Optimal: 50–70' },
            b12: { label: 'Vitamin B12', unit: 'pg/mL', range: [200, 900], optimal: [400, 900], note: 'Optimal: >400' },
            iron: { label: 'Iron (Serum)', unit: 'µg/dL', range: [60, 170], optimal: [80, 160], note: null },
            haemoglobin: { label: 'Haemoglobin', unit: 'g/dL', range: [12.0, 16.0], optimal: [13.0, 16.0], note: 'Female range' },
        }
    }
};

const GOAL_MARKERS = {
    fertility: ['amh', 'day3_fsh', 'lh', 'fsh', 'lh_fsh_ratio', 'estradiol', 'tsh', 'free_t3', 'free_t4'],
    pcos: ['lh', 'fsh', 'lh_fsh_ratio', 'total_testosterone', 'free_testosterone', 'dhea_s', 'shbg', 'amh', 'fasting_insulin', 'homa_ir'],
    thyroid: ['tsh', 'free_t3', 'free_t4', 'tpo_antibodies', 'tgab'],
    metabolic: ['fasting_glucose', 'fasting_insulin', 'homa_ir', 'hba1c', 'crp'],
    general: ['vitamin_d', 'b12', 'iron', 'haemoglobin', 'ferritin'],
};

// ─── TRAFFIC LIGHT SCORING ─────────────────────────────────────────────────────
function getTrafficLight(value, def) {
    if (value === undefined || value === null || value === '') return 'missing';
    const v = parseFloat(value);
    if (isNaN(v)) return 'missing';

    const [cLow, cHigh] = def.range;
    const [oLow, oHigh] = def.optimal || def.range;

    if (v < cLow || v > cHigh) return 'red';
    if (v >= oLow && v <= oHigh) return 'green';
    return 'amber';
}

const TRAFFIC_CFG = {
    green: { bg: '#EAF5EE', text: '#2D6A4F', border: 'rgba(45,106,79,0.15)', dot: '#2D6A4F', label: 'OPTIMAL', emoji: '🟢' },
    amber: { bg: '#FDF3E7', text: '#C97B2E', border: 'rgba(201,123,46,0.15)', dot: '#C97B2E', label: 'SUBOPTIMAL', emoji: '🟡' },
    red: { bg: '#FDECEA', text: '#9B2226', border: 'rgba(155,34,38,0.15)', dot: '#9B2226', label: 'OUT OF RANGE', emoji: '🔴' },
    missing: { bg: '#F7F1E8', text: '#6B7280', border: 'rgba(15,76,92,0.08)', dot: '#6B7280', label: 'NOT TESTED', emoji: '⚪' },
};

function getCategoryScore(cat, labData) {
    const statuses = Object.entries(cat.markers).map(([k, def]) => getTrafficLight(labData[k], def));
    const tested = statuses.filter(s => s !== 'missing');
    if (tested.length === 0) return 'missing';
    if (tested.includes('red')) return 'red';
    if (tested.includes('amber')) return 'amber';
    return 'green';
}

// ─── FERTILITY RISK FLAG ───────────────────────────────────────────────────────
function computeFertilityRisk(labData) {
    const reasons = [];
    let riskLevel = 'LOW';

    const lhFsh = parseFloat(labData.lh_fsh_ratio);
    if (!isNaN(lhFsh) && lhFsh > 2) {
        reasons.push('Elevated LH:FSH ratio (>2) — suggests PCOS pattern');
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'ELEVATED';
    }

    const homaIr = parseFloat(labData.homa_ir);
    if (!isNaN(homaIr) && homaIr > 2.5) {
        reasons.push('Insulin resistance detected (HOMA-IR >2.5)');
        riskLevel = 'ELEVATED';
    }

    const tsh = parseFloat(labData.tsh);
    if (!isNaN(tsh) && (tsh < 0.5 || tsh > 2.5)) {
        reasons.push(`TSH ${tsh} mIU/L — outside fertility-optimal range (0.5–2.5)`);
        riskLevel = riskLevel === 'LOW' ? 'MODERATE' : 'ELEVATED';
    }

    const amh = parseFloat(labData.amh);
    if (!isNaN(amh) && amh < 1.0) {
        reasons.push('Low AMH (<1.0 ng/mL) — may indicate diminished ovarian reserve');
        riskLevel = 'ELEVATED';
    }

    const fsh = parseFloat(labData.day3_fsh);
    if (!isNaN(fsh) && fsh > 10) {
        reasons.push('Elevated Day 3 FSH (>10 IU/L) — potential diminished reserve');
        riskLevel = 'ELEVATED';
    }

    return { riskLevel, reasons };
}

const FertilityRiskBanner = ({ labData }) => {
    const { riskLevel, reasons } = computeFertilityRisk(labData);
    const [expanded, setExpanded] = useState(false);

    const cfg = {
        LOW: { bg: '#EAF5EE', border: '#2D6A4F', accent: '#2D6A4F', icon: '🟢' },
        MODERATE: { bg: '#FDF3E7', border: '#C97B2E', accent: '#C97B2E', icon: '🟡' },
        ELEVATED: { bg: '#FDECEA', border: '#9B2226', accent: '#9B2226', icon: '🔴' },
    }[riskLevel];

    return (
        <div style={{
            backgroundColor: cfg.bg, borderLeft: `4px solid ${cfg.accent}`, borderRadius: '12px',
            padding: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(15,76,92,0.08)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
                    <div>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: cfg.accent, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                            Ovulatory Risk Assessment
                        </p>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                            {riskLevel} Risk Profile
                        </p>
                    </div>
                </div>
                {reasons.length > 0 && (
                    <button
                        onClick={() => setExpanded(e => !e)}
                        style={{
                            background: 'none', border: '1px solid rgba(15,76,92,0.15)',
                            borderRadius: '6px', padding: '5px 12px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 500, color: '#6B7280',
                            display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit'
                        }}
                    >
                        {reasons.length} Signal{reasons.length !== 1 ? 's' : ''}
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>

            {expanded && reasons.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(15,76,92,0.08)' }}>
                    {reasons.map((r, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            backgroundColor: '#FFFFFF', borderRadius: '6px',
                            padding: '10px 14px', border: '1px solid rgba(15,76,92,0.06)'
                        }}>
                            <span style={{ color: cfg.accent, display: 'flex', flexShrink: 0 }}>
                                <AlertTriangle size={14} />
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{r}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryScoreSummary = ({ labData }) => {
    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#0F4C5C', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="#F7F1E8" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#F7F1E8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Category Health Summary
                </span>
            </div>
            <div style={{ padding: '8px 0' }}>
                {Object.entries(MARKER_REGISTRY).map(([ck, cat]) => {
                    const score = getCategoryScore(cat, labData);
                    const cfg = TRAFFIC_CFG[score];
                    const tested = Object.entries(cat.markers).filter(([k]) =>
                        labData[k] !== undefined && labData[k] !== null && labData[k] !== ''
                    ).length;
                    const total = Object.keys(cat.markers).length;

                    return (
                        <div key={ck} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #EDE7DB' }} className="ai">
                            <span style={{
                                width: 28, height: 28, borderRadius: '6px', backgroundColor: cat.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', color: cat.color, fontWeight: 600, flexShrink: 0
                            }}>{cat.icon}</span>
                            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{cat.label}</span>
                            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginRight: 12 }}>{tested} / {total} Tested</span>
                            <span style={{
                                backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                                fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '4px', minWidth: 110, textAlign: 'center'
                            }}>{cfg.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── LAB ANALYSIS SUB-COMPONENTS ───────────────────────────────────────────────
function findMarkerMeta(key) {
    for (const [, cat] of Object.entries(MARKER_REGISTRY)) {
        if (cat.markers[key]) return { cat, def: cat.markers[key] };
    }
    return null;
}

const MarkerRow = ({ markerKey, def, value, patientLabRanges }) => {
    const trafficStatus = getTrafficLight(value, def);
    const hasValue = trafficStatus !== 'missing';
    const patientRange = patientLabRanges?.[markerKey];
    const labRangeDiffers = patientRange && (patientRange[0] !== def.range[0] || patientRange[1] !== def.range[1]);
    const cfg = TRAFFIC_CFG[trafficStatus];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#FFFFFF', border: '1px solid #EDE7DB' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: cfg.dot }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block' }}>{def.label}</span>
                {trafficStatus === 'amber' && def.optimal && (
                    <span style={{ fontSize: '11px', color: '#C97B2E', fontStyle: 'italic' }}>Optimal Target: {def.optimal[0]}–{def.optimal[1]} {def.unit}</span>
                )}
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: 600, color: '#0F4C5C', minWidth: 100, textAlign: 'right' }}>
                {hasValue ? `${value} ${def.unit}` : '—'}
            </span>
            <span style={{ fontSize: '12px', color: '#6B7280', minWidth: 110, textAlign: 'right' }}>Ref: {def.range[0]}–{def.range[1]} {def.unit}</span>
            <span style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', minWidth: 100, textAlign: 'center' }}>{cfg.label}</span>
            {labRangeDiffers && <span title="Lab Range Threshold Variance Flag" style={{ color: '#C97B2E', marginLeft: 4 }}><AlertTriangle size={14} /></span>}
        </div>
    );
};

const MissingMarkersAlert = ({ goal, presentKeys }) => {
    const required = GOAL_MARKERS[goal] || [];
    const missing = required.filter(k => !presentKeys.includes(k));
    if (missing.length === 0) return null;
    return (
        <div style={{ backgroundColor: '#FDF3E7', borderLeft: '4px solid #C97B2E', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={15} color="#C97B2E" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#C97B2E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Missing Markers For Program Goal ({goal})</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {missing.map(k => {
                    const found = findMarkerMeta(k);
                    if (!found) return null;
                    return (
                        <span key={k} className="pill" style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#1F2937' }}>
                            <strong>{found.def.label}</strong> <span style={{ color: '#6B7280' }}>({found.cat.label})</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

const CategorySection = ({ cat, labData, patientLabRanges }) => {
    const [open, setOpen] = useState(true);
    const entries = Object.entries(cat.markers);
    const testedCount = entries.filter(([k]) => labData[k] !== undefined && labData[k] !== null && labData[k] !== '').length;
    const scoreCfg = TRAFFIC_CFG[getCategoryScore(cat, labData)];

    return (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EDE7DB', marginBottom: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 30, height: 30, borderRadius: '6px', backgroundColor: cat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: cat.color, fontWeight: 600 }}>{cat.icon}</span>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#1F2937', textTransform: 'uppercase' }}>{cat.label}</span>
                <span style={{ fontSize: '12px', color: '#6B7280', marginRight: 10 }}>{testedCount} / {entries.length} Tested</span>
                <span style={{ backgroundColor: scoreCfg.bg, color: scoreCfg.text, border: `1px solid ${scoreCfg.border}`, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', marginRight: 10 }}>{scoreCfg.label}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && (
                <div style={{ padding: '16px 20px', backgroundColor: '#F7F1E8' }}>
                    {entries.map(([k, def]) => <MarkerRow key={k} markerKey={k} def={def} value={labData[k]} patientLabRanges={patientLabRanges} />)}
                </div>
            )}
        </div>
    );
};

const LabAnalysis = ({ labData = {}, patientGoal = 'general', patientLabRanges = {} }) => {
    const [activeGoal, setActiveGoal] = useState(patientGoal);
    const [searchQuery, setSearchQuery] = useState('');
    const presentKeys = Object.keys(labData).filter(k => labData[k] !== undefined && labData[k] !== '');

    const filteredCategories = Object.entries(MARKER_REGISTRY).filter(([, cat]) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return cat.label.toLowerCase().includes(q) || Object.values(cat.markers).some(d => d.label.toLowerCase().includes(q));
    });

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '20px' }}>
                <FlaskConical size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Biomarker Integration Engine</h2>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.keys(GOAL_MARKERS).map(g => (
                    <button key={g} onClick={() => setActiveGoal(g)} className={`do ${activeGoal === g ? 'on' : ''}`}>{g} Panel</button>
                ))}
            </div>

            <MissingMarkersAlert goal={activeGoal} presentKeys={presentKeys} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #EDE7DB', padding: '10px 14px', marginBottom: 16 }}>
                <Search size={14} color="#6B7280" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter active health biomarkers..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%', fontFamily: 'inherit' }} />
            </div>

            <CategoryScoreSummary labData={labData} />

            {filteredCategories.map(([ck, cat]) => <CategorySection key={ck} cat={cat} labData={labData} patientLabRanges={patientLabRanges} />)}
        </div>
    );
};

// ─── INTAKE SUMMARY COMPONENT ─────────────────────────────────────────────
const IntakeSummary = ({ intake }) => {
    if (!intake || Object.keys(intake).length === 0) return null;

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '16px' }}>
                <ClipboardList size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Intake Diagnostics</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {intake.diagnoses?.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>Diagnostic History</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {intake.diagnoses.map((d, i) => <span key={i} className="pill on">{d}</span>)}
                        </div>
                    </div>
                )}
                {intake.symptoms?.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>Reported Symptoms</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {intake.symptoms.map((s, i) => <span key={i} className="pill" style={{ backgroundColor: '#FDF3E7', color: '#C97B2E' }}>{s}</span>)}
                        </div>
                    </div>
                )}
                {intake.goals && (
                    <div>
                        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Milestones</h3>
                        <p style={{ fontSize: '13px', padding: '12px', backgroundColor: '#F7F1E8', borderRadius: '8px' }}>{intake.goals}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── PATIENT REVIEW VIEW COMPONENT ──────────────────────────────────────────
const PatientReviewView = ({ reviews }) => {
    if (!reviews || reviews.length === 0) return null;

    const latestReview = reviews[0];
    const date = new Date(latestReview.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const cleanMessage = latestReview.message_text ? latestReview.message_text.split('=== AI SUMMARY REFERENCE ===')[0].trim() : '';

    return (
        <section style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <CheckCircle2 size={18} color="#0F4C5C" />
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600 }}>Clinical Assessment Update</h2>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#E8F4F7', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ backgroundColor: '#0F4C5C', color: '#F7F1E8', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {latestReview.reviewed_by?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{latestReview.reviewed_by || 'Care Specialist'}</p>
                            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{date}</p>
                        </div>
                    </div>
                    {latestReview.next_step && <span className="at d">{latestReview.next_step}</span>}
                </div>
                <div style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{cleanMessage}</p>
                </div>
                {latestReview.protocol_attachment_url && (
                    <div style={{ backgroundColor: '#F7F1E8', padding: '12px 20px', borderTop: '1px solid #EDE7DB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }} className="flex items-center gap-2"><FileText size={16} /> Updated Strategic Protocol Attached</span>
                        <a href={latestReview.protocol_attachment_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>View Document</a>
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const Dashboard = ({ patientId: propPatientId }) => {
    const { patientId: urlPatientId } = useParams();
    const activePatientId = propPatientId || urlPatientId;
    
    const navigate = useNavigate();
    const [data, setData] = useState({ labs: [], symptoms: [], specialistReviews: [] });
    const [demographics, setDemographics] = useState({ name: '—', age: '—', gender: '—', goal: 'general' });
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [activeProtocolTab, setActiveProtocolTab] = useState('nut');
    const [intakeData, setIntakeData] = useState(null);

    // State mechanics for internal subjective monitoring checks
    const [checkinForm, setCheckinForm] = useState({ energy: 8, mood: 9, sleep: 9, stress: 1, symptoms: ['Constipation'], notes: 'Type 2 today, still feels lumpy. Iron definitely slowing things down but drinking more water today.' });

    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : import.meta.env.VITE_SERVER_URL || '';

    useEffect(() => {
        if (activePatientId) {
            fetchDashboardData();
        }
    }, [activePatientId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${baseURL}/api/patient/dashboard/${activePatientId}`);
            if (res.data.success) {
                setData({
                    labs: res.data.labs,
                    symptoms: res.data.symptoms,
                    specialistReviews: res.data.specialistReviews
                });
                if (res.data.profile) {
                    setDemographics(res.data.profile);
                }
                setIntakeData(res.data.intake);
            }
        } catch (err) {
            console.error("Dashboard fetch operational safeguard hit:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAppointmentSubmit = async () => {
        if (!notes.trim()) return;
        setSending(true);
        try {
            await axios.post(`${baseURL}/api/patient/request-appointment`, { patientId: activePatientId, notes });
            alert("Strategic message dispatched to support@allvihealth.com!");
            setIsModalOpen(false);
            setNotes('');
        } catch {
            alert("Strategic communication relay pipeline failed.");
        } finally {
            setSending(false);
        }
    };

    const handleCheckinSubmit = async () => {
        try {
            await axios.post(`${baseURL}/api/patient/import-symptoms`, {
                patientId: activePatientId,
                symptoms: [{
                    date: new Date().toISOString().split('T')[0],
                    energy: checkinForm.energy,
                    sleep: checkinForm.sleep,
                    mood: checkinForm.mood,
                    stress: checkinForm.stress
                }]
            });
            alert("Daily Metric Log Captured Successfully!");
            await fetchDashboardData();
            setCurrentScreen('dashboard');
        } catch (err) {
            alert("Failed to save operational biometric logs.");
        }
    };

    const getDynamicBiomarkers = () => {
        if (!data.labs || data.labs.length === 0) return [];
        const keys = new Set();
        data.labs.forEach(report => {
            Object.keys(report).forEach(key => {
                if (!['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(key)) {
                    keys.add(key);
                }
            });
        });
        return Array.from(keys);
    };

    const getMergedLabData = () => {
        const merged = { meta: {} };
        if (data.labs && data.labs.length > 0) {
            [...data.labs].reverse().forEach(report => {
                Object.entries(report).forEach(([k, v]) => {
                    if (!['id', 'test_date', 'report_type', 'created_at', 'patient_id', 'meta'].includes(k) && !(k in merged)) {
                        merged[k] = v;
                        if (report.meta && report.meta[k]) {
                            merged.meta[k] = report.meta[k];
                        }
                    }
                });
            });
        }
        return merged;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const response = await axios.post(`${baseURL}/api/patient/import-symptoms`, {
                        patientId: activePatientId,
                        symptoms: results.data
                    });
                    if (response.data.success) {
                        alert("Biometric CSV records processed successfully!");
                        await fetchDashboardData();
                    }
                } catch (error) {
                    alert("Failure executing symptom import parse script.");
                }
            }
        });
    };

    const ChartCard = ({ title, dataKey, color, data: sourceData }) => {
        const latestEntry = [...sourceData].reverse().find(entry => entry[dataKey] !== undefined);
        const meta = latestEntry?.meta?.[dataKey] || {};
        const currentValue = latestEntry?.[dataKey] !== undefined ? latestEntry[dataKey] : '—';

        return (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                        <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1F2937' }}>{meta.label || title.replace(/_/g, ' ')}</h3>
                    </div>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: '#0F4C5C' }}>{currentValue}<span style={{ fontSize: '11px', color: '#6B7280', marginLeft: '2px', fontFamily: 'sans-serif', fontWeight: 400 }}>{meta.unit || ''}</span></span>
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', padding: '3px 8px', backgroundColor: '#EDE7DB', borderRadius: '4px', alignSelf: 'flex-start', marginBottom: '12px' }}>Ref Range: {meta.ref_range || 'N/A'}</div>
                <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sourceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" vertical={false} />
                            <XAxis dataKey="test_date" tick={{ fontSize: 9, fill: '#6B7280' }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#6B7280' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                            <Line connectNulls type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const mergedLabData = getMergedLabData();

    // Compute dynamic telemetry fields for the target main metrics blocks (Dashboard & Weekly Report panels)
    const latestSymptomRow = data.symptoms && data.symptoms.length > 0 
        ? data.symptoms[data.symptoms.length - 1] 
        : null;

    const historicalSymptomRow = data.symptoms && data.symptoms.length > 1 
        ? data.symptoms[data.symptoms.length - 2] 
        : null;

    const evaluateTrend = (currentVal, pastRow, metricField) => {
        if (currentVal === undefined || currentVal === null) return "No data logged";
        if (!pastRow || pastRow[metricField] === undefined) return "→ stable snapshot";
        const delta = currentVal - pastRow[metricField];
        if (delta > 0) return `↑ up from ${pastRow[metricField]}`;
        if (delta < 0) return `↓ down from ${pastRow[metricField]}`;
        return "→ stable vs last entry";
    };

    const dynamicEnergy = latestSymptomRow?.energy !== undefined ? latestSymptomRow.energy : 7.8;
    const dynamicMood = latestSymptomRow?.mood !== undefined ? latestSymptomRow.mood : 8.4;
    const dynamicSleep = latestSymptomRow?.sleep !== undefined ? latestSymptomRow.sleep : 9.2;
    const dynamicStress = latestSymptomRow?.stress !== undefined ? latestSymptomRow.stress : 1.2;

    return (
        <div style={{ backgroundColor: '#F7F1E8', minHeight: '100vh' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .nav { background: #0F4C5C; padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
                .nav-logo { font-family: 'Playfair Display', serif; font-size: 22px; color: #F7F1E8; }
                .nav-logo span { font-size: 10px; font-family: 'DM Sans', sans-serif; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(247,241,232,0.6); display: block; margin-top: -2px; }
                .nav-right { display: flex; align-items: center; gap: 20px; }
                .nav-streak { background: rgba(247,241,232,0.12); border-radius: 20px; padding: 6px 14px; font-size: 13px; color: #F7F1E8; font-weight: 500; }
                .nav-streak strong { color: #F5C842; }
                .nav-avatar { width: 36px; height: 36px; border-radius: 50%; background: #EDE7DB; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #0F4C5C; }
                
                .layout { display: flex; min-height: calc(100vh - 64px); }
                .sidebar { width: 220px; min-width: 220px; background: #FFFFFF; border-right: 1px solid rgba(15,76,92,0.08); padding: 24px 0; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; flex-shrink: 0; text-align: left; }
                .si-section { padding: 16px 20px 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(107,114,128,0.7); }
                .si { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 14px; font-weight: 500; color: #6B7280; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; }
                .si:hover { background: #E8F4F7; color: #0F4C5C; }
                .si.on { background: #E8F4F7; color: #0F4C5C; border-left-color: #0F4C5C; font-weight: 600; }
                .si-icon { width: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
                
                .main { flex: 1; padding: 32px; max-width: 960px; text-align: left; }
                .card { background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); margin-bottom: 24px; }
                .ph { margin-bottom: 28px; }
                .ph-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 600; color: #1F2937; }
                .ph-sub { font-size: 14px; color: #6B7280; margin-top: 4px; }
                .g4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
                .kpi { background: #FFFFFF; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); position: relative; overflow: hidden; }
                .kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #0F4C5C; }
                .kpi.am::before { background: #C97B2E; }
                .kpi.gr::before { background: #2D6A4F; }
                .kpi-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; }
                .kpi-val { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: #0F4C5C; line-height: 1; }
                .kpi-val.am { color: #C97B2E; }
                .kpi-val.gr { color: #2D6A4F; }
                .kpi-sub { font-size: 12px; color: #6B7280; margin-top: 6px; }
                
                .cb { background: #0F4C5C; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; cursor: pointer; }
                .cb h3 { font-size: 16px; font-weight: 600; color: #F7F1E8; }
                .cb p { font-size: 13px; color: rgba(247,241,232,0.7); margin-top: 2px; }
                .cb-btn { background: #F7F1E8; color: #0F4C5C; border: none; border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
                
                .ic { border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid; }
                .ic.gr { background: #EAF5EE; border-left-color: #2D6A4F; }
                .ic.am { background: #FDF3E7; border-left-color: #C97B2E; }
                .ic-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
                .ic-tag.gr { color: #2D6A4F; }
                .ic-tag.am { color: #C97B2E; }
                .ic-title { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 4px; }
                .ic-body { font-size: 13px; color: #6B7280; line-height: 1.5; }
                
                .pill { padding: 7px 14px; border: 1.5px solid rgba(15,76,92,0.15); border-radius: 20px; font-size: 13px; color: #1F2937; cursor: pointer; transition: all 0.15s; background: #FFFFFF; display: inline-block; }
                .pill.on { background: #0F4C5C; border-color: #0F4C5C; color: #F7F1E8; }
                .pill.none { border-style: dashed; color: #6B7280; }
                .do { padding: 8px 16px; border: 1.5px solid rgba(15,76,92,0.15); border-radius: 8px; font-size: 13px; cursor: pointer; background: #FFFFFF; color: #1F2937; transition: all 0.15s; }
                .do.on { background: #0F4C5C; border-color: #0F4C5C; color: #F7F1E8; }
                .btn-primary { background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
                .btn-ghost { background: none; color: #0F4C5C; border: 1px solid #0F4C5C; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
                .sub-btn { width: 100%; background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
                .ta { width: 100%; min-height: 80px; padding: 12px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-family: inherit; font-size: 14px; color: #1F2937; background: #F7F1E8; resize: vertical; outline: none; line-height: 1.5; }
                
                .rh { background: #EDE7DB; border-radius: 12px; padding: 28px; margin-bottom: 24px; border: 1px solid rgba(15,76,92,0.06); }
                .rw { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 600; color: #1F2937; margin-bottom: 4px; }
                .rm { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
                .rk { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                .rkc { background: #FFFFFF; border: 1px solid rgba(15,76,92,0.08); border-radius: 10px; padding: 14px; text-align: center; box-shadow: 0 1px 3px rgba(15,76,92,0.04); }
                .rkv { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: #0F4C5C; }
                .rkv.am { color: #C97B2E; }
                .rkv.gr { color: #2D6A4F; }
                .rkl { font-size: 11px; color: #6B7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
                .rkd { font-size: 11px; margin-top: 4px; font-weight: 500; }
                
                .dr { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid #EDE7DB; }
                .dr:last-child { border-bottom: none; }
                .ds { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
                .ds.gr { background: #EAF5EE; }
                .ds.am { background: #FDF3E7; }
                .dn { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 4px; }
                .dd { font-size: 13px; color: #6B7280; line-height: 1.5; }
                .dbadge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }
                .dbadge.gr { background: #EAF5EE; color: #2D6A4F; }
                .dbadge.am { background: #FDF3E7; color: #C97B2E; }
                
                .avs-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #0F4C5C; border-bottom: 1px solid #E8F4F7; padding-bottom: 6px; margin-bottom: 12px; }
                .avt { width: 100%; border-collapse: collapse; }
                .avt td { padding: 8px 4px; font-size: 13px; border-bottom: 1px solid #EDE7DB; vertical-align: top; }
                .avt td:first-child { font-weight: 600; color: #6B7280; width: 38%; }
                .avt tr:last-child td { border-bottom: none; }
                .qn { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #EDE7DB; }
                .qn:last-child { border-bottom: none; }
                .qn-num { width: 24px; height: 24px; background: #0F4C5C; color: #F7F1E8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
                .qn-text { font-size: 13px; color: #1F2937; line-height: 1.5; }
                
                .pt-tabs { display: flex; gap: 0; border-bottom: 2px solid #EDE7DB; margin-bottom: 20px; overflow-x: auto; }
                .pt-tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; transition: all 0.15s; }
                .pt-tab:hover { color: #0F4C5C; }
                .pt-tab.on { color: #0F4C5C; border-bottom-color: #0F4C5C; font-weight: 600; }
                .pt-content { display: none; }
                .pt-content.on { display: block; }
                .pr { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #EDE7DB; }
                .pr:last-child { border-bottom: none; }
                .pr-icon { font-size: 18px; flex-shrink: 0; width: 28px; text-align: center; }
                .pr-title { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 3px; }
                .pr-detail { font-size: 13px; color: #6B7280; line-height: 1.5; }
                .stab { width: 100%; border-collapse: collapse; }
                .stab th { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; padding: 8px 10px; text-align: left; border-bottom: 2px solid #EDE7DB; }
                .stab td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #F7F1E8; vertical-align: top; }
                .stab tr:last-child td { border-bottom: none; }
                .cl-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #EDE7DB; }
                .cl-item:last-child { border-bottom: none; }
                .cb-box { width: 18px; height: 18px; border: 2px solid #6B7280; border-radius: 4px; flex-shrink: 0; margin-top: 1px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 11px; }
                .cb-box.done { background: #2D6A4F; border-color: #2D6A4F; color: white; }
                .cl-text { font-size: 13px; color: #1F2937; line-height: 1.5; }
                .pb { height: 6px; background: #EDE7DB; border-radius: 3px; overflow: hidden; margin-top: 6px; }
                .pb-fill { height: 100%; background: #0F4C5C; border-radius: 3px; }
                .pb-fill.gr { background: #2D6A4F; }
                
                .mt { display: flex; flex-direction: column; gap: 12px; }
                .msg { max-width: 72%; }
                .msg.p { align-self: flex-end; }
                .msg.a { align-self: flex-start; }
                .mb { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; text-align: left; }
                .p .mb { background: #0F4C5C; color: #F7F1E8; border-bottom-right-radius: 4px; }
                .a .mb { background: #FFFFFF; color: #1F2937; border: 1px solid rgba(15,76,92,0.1); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); }
                .mm { font-size: 11px; color: #6B7280; margin-top: 4px; padding: 0 4px; }
                .p .mm { text-align: right; }
                .mir { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #EDE7DB; }
                .mi { flex: 1; padding: 11px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-size: 14px; background: #F7F1E8; color: #1F2937; outline: none; }
                .ms { background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
                
                .sl-row { margin-bottom: 18px; }
                .sl-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .sl-name { font-size: 14px; font-weight: 500; color: #1F2937; }
                .sl-val { font-size: 16px; font-weight: 700; color: #0F4C5C; font-family: 'Playfair Display', serif; }
                input[type=range] { width: 100%; height: 4px; border-radius: 2px; background: #EDE7DB; appearance: none; outline: none; cursor: pointer; }
                input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; background: #0F4C5C; border-radius: 50%; cursor: pointer; box-shadow: 0 1px 4px rgba(15,76,92,0.3); }
                .cs-title { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B7280; margin-bottom: 14px; margin-top: 24px; }
                `
            }} />

            {/* TOP BAR BRAND ENGINE NAVIGATION */}
            <nav className="nav">
                <div className="nav-logo">Allvi <span>Reimagined Patient Care</span></div>
                <div className="nav-right">
                    <div className="nav-streak">🔥 <strong>77</strong> day streak</div>
                    <div className="nav-avatar">{demographics.name?.charAt(0) || 'R'}</div>
                </div>
            </nav>

            <div className="layout">
                {/* EXACT REFERENCE SPECIFICATION COMPLIANT SIDEBAR */}
                <aside className="sidebar no-print">
                    <div className="si-section">Overview</div>
                    <div className={`si ${currentScreen === 'dashboard' ? 'on' : ''}`} onClick={() => setCurrentScreen('dashboard')}>
                        <span className="si-icon"><LayoutDashboard size={16} /></span> Dashboard
                    </div>
                    <div className={`si ${currentScreen === 'checkin' ? 'on' : ''}`} onClick={() => setCurrentScreen('checkin')}>
                        <span className="si-icon"><CheckSquare size={16} /></span> Daily Check-In
                    </div>

                    <div className="si-section">Reports</div>
                    <div className={`si ${currentScreen === 'reports' ? 'on' : ''}`} onClick={() => setCurrentScreen('reports')}>
                        <span className="si-icon"><ClipboardList size={16} /></span> Weekly Reports
                    </div>
                    <div className={`si ${currentScreen === 'advocacy' ? 'on' : ''}`} onClick={() => setCurrentScreen('advocacy')}>
                        <span className="si-icon"><FileText size={16} /></span> Advocacy Doc
                    </div>

                    <div className="si-section">Health</div>
                    <div className={`si ${currentScreen === 'labs' ? 'on' : ''}`} onClick={() => setCurrentScreen('labs')}>
                        <span className="si-icon"><FlaskConical size={16} /></span> Lab Results
                    </div>
                    <div className={`si ${currentScreen === 'protocol' ? 'on' : ''}`} onClick={() => setCurrentScreen('protocol')}>
                        <span className="si-icon"><BookOpen size={16} /></span> My Protocol
                    </div>

                    <div className="si-section">Support</div>
                    <div className={`si ${currentScreen === 'messages' ? 'on' : ''}`} onClick={() => setCurrentScreen('messages')}>
                        <span className="si-icon"><MessageSquare size={16} /></span> Messages
                    </div>
                    <div className="si" onClick={() => setIsModalOpen(true)}>
                        <span className="si-icon"><PhoneCall size={16} /></span> Book a Call
                    </div>
                </aside>

                {/* PRIMARY SYSTEM SUB-SCREEN LAYER INTERACTION */}
                <main className="main">
                    
                    {/* ═══════════════════════ SCREEN 1: CORE DASHBOARD HUB ═══════════════════════ */}
                    {currentScreen === 'dashboard' && (
                        <>
                            <div className="ph">
                                <h1 className="ph-title">Hello, {demographics.name || 'Patient'}</h1>
                                <p className="ph-sub">Baseline Protocol Registry ID: <strong>{activePatientId}</strong> • Monitor Core Focus: <span style={{ color: '#0F4C5C', fontWeight: 600, textTransform: 'uppercase' }}>{demographics.goal || 'General Health'}</span></p>
                            </div>

                            <div className="cb" onClick={() => setCurrentScreen('checkin')}>
                                <div>
                                    <h3>Today's check-in is ready</h3>
                                    <p>Takes under 3 minutes · Personalised from yesterday's entry</p>
                                </div>
                                <button className="cb-btn">Check In Now →</button>
                            </div>

                            {/* DYNAMIC METRIC KPI CONTAINER CONNECTED TO BACKEND TELEMETRY SENSORS */}
                            <div className="g4">
                                <div className="kpi">
                                    <div className="kpi-label">Energy</div>
                                    <div className="kpi-val">{dynamicEnergy}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Mood</div>
                                    <div className="kpi-val gr">{dynamicMood}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Sleep</div>
                                    <div className="kpi-val gr">{dynamicSleep}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}</div>
                                </div>
                                <div className="kpi am">
                                    <div className="kpi-label">Stress</div>
                                    <div className="kpi-val am">{dynamicStress}</div>
                                    <div className="kpi-sub" style={{ color: dynamicStress <= 2 ? '#2D6A4F' : '#9B2226' }}>
                                        {dynamicStress <= 1.5 && latestSymptomRow ? "↓ programme low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                                    </div>
                                </div>
                            </div>

                            <div className="g2">
                                <div className="card">
                                    <div className="card-title">11-Week Trend</div>
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F4C5C' }}></div>Energy</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2D6A4F' }}></div>Mood</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C97B2E' }}></div>Sleep</div>
                                    </div>
                                    <div style={{ width: '100%', height: 160 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.symptoms?.length ? data.symptoms : [
                                                { date: 'W1', energy: 5, mood: 4, sleep: 4 },
                                                { date: 'W3', energy: 6.4, mood: 4.9, sleep: 3.2 },
                                                { date: 'W5', energy: 7, mood: 4.9, sleep: 3.8 },
                                                { date: 'W7', energy: 5.7, mood: 5.4, sleep: 8 },
                                                { date: 'W9', energy: 8, mood: 6.4, sleep: 3.8 },
                                                { date: 'W11', energy: 7.8, mood: 8.4, sleep: 9.2 }
                                            ]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" vertical={false} />
                                                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <Line connectNulls type="monotone" dataKey="energy" stroke="#0F4C5C" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="mood" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="sleep" stroke="#C97B2E" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-title">Patterns & Insights</div>
                                    <div className="ic gr"><div className="ic-tag gr">✓ Positive</div><div className="ic-title">Stress at programme low</div><div className="ic-body">1.2 — lowest in 11 weeks. Even with GI changes, your nervous system is stable.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Watch</div><div className="ic-title">Evening exercise timing</div><div className="ic-body">Sat evening pickleball → Sun energy 7. Daytime sessions perform better for you.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Monitor</div><div className="ic-title">GI — iron protocol Week 1</div><div className="ic-body">Expected adjustment. Increase hydration on iron days. Should resolve by Week 2.</div></div>
                                </div>
                            </div>

                            <PatientReviewView reviews={data.specialistReviews} />
                            <IntakeSummary intake={intakeData} />

                            {/* RESTORED: LONGITUDINAL PANEL TRACKING TIMELINE GRID SECTION */}
                            <section style={{ marginBottom: '24px' }}>
                                <div style={{ borderBottom: '1px solid #EDE7DB', paddingBottom: '6px', marginBottom: '16px' }}>
                                    <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Longitudinal Panel Tracking Timeline</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    {getDynamicBiomarkers().map(markerKey => (
                                        <ChartCard key={markerKey} title={markerKey} dataKey={markerKey} color="#0F4C5C" data={data.labs} />
                                    ))}
                                </div>
                            </section>

                            <section className="card" style={{ marginBottom: '24px' }}>
                                <LabAnalysis labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} patientLabRanges={data.labRanges} />
                            </section>

                            <section className="card">
                                <AIInsights patientId={activePatientId} labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} demographics={demographics} intake={intakeData} />
                            </section>

                            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                <button
                                    disabled={isGeneratingSummary}
                                    onClick={async () => {
                                        setIsGeneratingSummary(true);
                                        try {
                                            const response = await axios.get(`${baseURL}/api/patient/insights/${activePatientId}`);
                                            navigate(`/clinical-summary/${activePatientId}`, {
                                                state: {
                                                    profile: demographics,
                                                    intake: intakeData,
                                                    labData: getMergedLabData(),
                                                    aiInsights: response.data.success ? response.data.insights : "AI Engine payload execution unfulfilled."
                                                }
                                            });
                                        } catch (err) {
                                            alert("Strategic diagnostic meta vectors calculation sequence broken.");
                                        } finally {
                                            setIsGeneratingSummary(false);
                                        }
                                    }}
                                    className="sub-btn"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '340px' }}
                                >
                                    {isGeneratingSummary ? <Loader2 className="animate-spin" size={16} /> : <FilePlus size={16} />}
                                    {isGeneratingSummary ? "Compiling Meta Vectors..." : "Generate Clinical Summary"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 2: DAILY CHECK-IN FORM ═══════════════════════ */}
                    {currentScreen === 'checkin' && (
                        <>
                            <div className="ph">
                                <div className="ph-title">Daily Check-In</div>
                                <div className="ph-sub">Sunday, 11 May 2026 · Yesterday you mentioned constipation. How are you feeling today?</div>
                            </div>
                            <div className="card">
                                <div className="cs-title" style={{ marginTop: 0 }}>How are you feeling today?</div>
                                <div className="sl-row">
                                    <div className="sl-label"><span className="sl-name">⚡ Energy</span><span className="sl-val">{checkinForm.energy}</span></div>
                                    <input type="range" min="1" max="10" value={checkinForm.energy} onChange={e => setCheckinForm({ ...checkinForm, energy: parseInt(e.target.value) })} />
                                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '10px', color: '#6B7280', marginTop: '4px' }}><span>Low</span><span style={{ marginLeft: 'auto' }}>High</span></div>
                                </div>
                                <div className="sl-row">
                                    <div className="sl-label"><span className="sl-name">♥ Mood</span><span className="sl-val">{checkinForm.mood}</span></div>
                                    <input type="range" min="1" max="10" value={checkinForm.mood} onChange={e => setCheckinForm({ ...checkinForm, mood: parseInt(e.target.value) })} />
                                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '10px', color: '#6B7280', marginTop: '4px' }}><span>Low</span><span style={{ marginLeft: 'auto' }}>High</span></div>
                                </div>
                                <div className="sl-row">
                                    <div className="sl-label"><span className="sl-name">🌙 Sleep quality</span><span className="sl-val">{checkinForm.sleep}</span></div>
                                    <input type="range" min="1" max="10" value={checkinForm.sleep} onChange={e => setCheckinForm({ ...checkinForm, sleep: parseInt(e.target.value) })} />
                                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '10px', color: '#6B7280', marginTop: '4px' }}><span>Poor</span><span style={{ marginLeft: 'auto' }}>Excellent</span></div>
                                </div>
                                <div className="sl-row">
                                    <div className="sl-label"><span className="sl-name">🍃 Stress</span><span className="sl-val">{checkinForm.stress}</span></div>
                                    <input type="range" min="1" max="10" value={checkinForm.stress} onChange={e => setCheckinForm({ ...checkinForm, stress: parseInt(e.target.value) })} />
                                    <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '10px', color: '#6B7280', marginTop: '4px' }}><span>None</span><span style={{ marginLeft: 'auto' }}>High</span></div>
                                </div>

                                <div className="cs-title">Symptoms today</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {['Fatigue', 'Constipation', 'Brain fog', 'Feeling cold', 'Joint pain', 'Hair loss', 'Anxiety', 'Low mood', 'Palpitations'].map(sym => {
                                        const hasSym = checkinForm.symptoms.includes(sym);
                                        return (
                                            <div key={sym} className={`pill ${hasSym ? 'on' : ''}`} onClick={() => {
                                                const next = hasSym ? checkinForm.symptoms.filter(x => x !== sym) : [...checkinForm.symptoms, sym];
                                                setCheckinForm({ ...checkinForm, symptoms: next });
                                            }}>{sym}</div>
                                        );
                                    })}
                                </div>

                                <div className="cs-title">Bowel movement today?</div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                                    <div className="do on">Yes</div><div className="do">No</div>
                                </div>

                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', marginBottom: '8px' }}>Bristol Stool Scale</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {['Type 1', 'Type 2', 'Type 3', 'Type 4 ✓', 'Type 5', 'Type 6', 'Type 7'].map(type => (
                                        <div key={type} className={`do ${type.includes('Type 2') ? 'on' : ''}`}>{type}</div>
                                    ))}
                                </div>

                                <div className="cs-title">Anything else to note?</div>
                                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', fontStyle: 'italic' }}>Yesterday you mentioned the iron felt constipating. Any change today?</p>
                                <textarea className="ta" value={checkinForm.notes} onChange={e => setCheckinForm({ ...checkinForm, notes: e.target.value })} />
                                
                                <button className="sub-btn" onClick={handleCheckinSubmit}>Submit Check-In ✓</button>
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 3: WEEKLY REPORT SCREEN (DYNAMIC & SYNCED) ═══════════════════════ */}
                    {currentScreen === 'reports' && (
                        <>
                            <div className="ph">
                                <div className="ph-title">Week 11 Report</div>
                                <div className="ph-sub">April 22–26, 2026 · Compiled tracking records matrix view</div>
                            </div>
                            <div className="rh">
                                <div className="rw">Week 11 Performance</div>
                                <div className="rm">Aggregated telemetry values directly populated from your actual active logs database history.</div>
                                <div className="rk">
                                    <div className="rkc">
                                        <div className="rkv gr">{dynamicEnergy}</div>
                                        <div className="rkl">Energy</div>
                                        <div className="rkd" style={{ color: '#6B7280' }}>
                                            {evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}
                                        </div>
                                    </div>
                                    <div className="rkc">
                                        <div className="rkv gr">{dynamicMood}</div>
                                        <div className="rkl">Mood</div>
                                        <div className="rkd" style={{ color: '#2D6A4F' }}>
                                            {evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}
                                        </div>
                                    </div>
                                    <div className="rkc">
                                        <div className="rkv gr">{dynamicSleep}</div>
                                        <div className="rkl">Sleep</div>
                                        <div className="rkd" style={{ color: '#6B7280' }}>
                                            {evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}
                                        </div>
                                    </div>
                                    <div className="rkc">
                                        <div className="rkv am">{dynamicStress}</div>
                                        <div className="rkl">Stress</div>
                                        <div className="rkd" style={{ color: dynamicStress <= 1.5 ? '#2D6A4F' : '#9B2226' }}>
                                            {dynamicStress <= 1.5 && latestSymptomRow ? "↓ program low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-title">Clinical Monitoring Indicators</div>
                                <div className="dr"><div className="ds gr">🟢</div><div><div className="dn">Medication Response Metric <span className="dbadge gr">Active</span></div><div className="dd">Thyroid values remain stable based on merged profile diagnostics. Palpitations and sweating resolved. Keep current dosage structure.</div></div></div>
                                <div className="dr"><div className="ds am">🟡</div><div><div className="dn">Gut Motility Adjustment <span className="dbadge am">Monitoring</span></div><div className="dd">Iron protocol absorption phase introduction remains active. Hydration should be tracked closely on alternate days.</div></div></div>
                            </div>

                            <div className="card" style={{ marginTop: '24px' }}>
                                <div className="card-title">Active Timeline Structural Analysis</div>
                                <div className="ic gr"><div className="ic-tag gr">✓ Baseline Ingestion Check</div><div className="ic-title">Nervous system holding optimal metrics</div><div className="ic-body">Dynamic stress factors average stays balanced at {dynamicStress}, demonstrating positive program adaptation thresholds.</div></div>
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 4: ADVOCACY DOC SCREEN ═══════════════════════ */}
                    {currentScreen === 'advocacy' && (
                        <>
                            <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <div className="ph-title">Appointment Advocacy Document</div>
                                    <div className="ph-sub">Prepared for Endocrinologist Consultation · April 15, 2026</div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 12px', background: '#EAF5EE', borderRadius: '20px' }}><span style={{ fontSize: '11px', fontWeight: 700, color: '#2D6A4F' }}>✓ CLINICIAN APPROVED</span></div>
                                </div>
                                <button className="btn-primary" onClick={() => window.print()}>⬇ Download PDF</button>
                            </div>

                            <div className="card">
                                <div className="avs-title">Patient Context</div>
                                <table className="avt">
                                    <tbody>
                                        <tr><td>Diagnosis</td><td>Hashimoto's Thyroiditis — January 2026</td></tr>
                                        <tr><td>Medication</td><td>Levothyroxine 25mcg daily (taken 6am). Day 45 as of April 14.</td></tr>
                                        <tr><td>Supplements</td><td>Selenium, Magnesium glycinate, B12+K2, Omega-3, Multivitamin, Iron 25mg, Zinc 15mg, Curcumin 500mg</td></tr>
                                    </tbody>
                                </table>

                                <div className="avs-title" style={{ marginTop: '24px' }}>Questions for This Consultation</div>
                                <div className="qn"><div className="qn-num">1</div><div className="qn-text"><strong>Iron supplementation:</strong> is 25mg ferrous bisglycinate sufficient? Ferritin declined from 24 → 19 ng/mL over 2.5 months of supplementation.</div></div>
                                <div className="qn"><div className="qn-num">2</div><div className="qn-text"><strong>Should ferritin be rechecked sooner than May?</strong> Ferritin moved in the wrong direction on current supplementation.</div></div>
                                <div className="qn"><div className="qn-num">3</div><div className="qn-text"><strong>Levothyroxine dose:</strong> does TSH 2.13 change your recommendation? Patient self-titrated to 25mcg from prescribed 50mcg.</div></div>
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 5: MY PROTOCOL SCREEN ═══════════════════════ */}
                    {currentScreen === 'protocol' && (
                        <>
                            <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div><div className="ph-title">My Protocol</div><div className="ph-sub">Personalised Lifestyle Support · Hashimoto's · Delivered Week 2</div></div>
                                <button className="btn-primary">⬇ Download PDF</button>
                            </div>

                            <div className="card" style={{ background: '#0F4C5C', border: 'none', color: '#F7F1E8' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)' }}>Diagnosis</div><div style={{ fontSize: '14px', fontWeight: 600 }}>Hashimoto's Thyroiditis</div></div>
                                    <div><div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(247,241,232,0.6)' }}>Primary Goals</div><div style={{ fontSize: '13px' }}>Improve GI · Slow autoimmune attack</div></div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="pt-tabs">
                                    <div className={`pt-tab ${activeProtocolTab === 'nut' ? 'on' : ''}`} onClick={() => setActiveProtocolTab('nut')}>🥗 Nutrition</div>
                                    <div className={`pt-tab ${activeProtocolTab === 'sup' ? 'on' : ''}`} onClick={() => setActiveProtocolTab('sup')}>💊 Supplements</div>
                                </div>

                                {activeProtocolTab === 'nut' && (
                                    <div className="pt-content on">
                                        <div className="pr"><div className="pr-icon">🚫</div><div><div className="pr-title">Always avoid: Gluten, dairy, soy, refined sugar</div><div className="pr-detail">Gluten triggers molecular mimicry with thyroid tissue. Your dramatic improvement confirms these were key triggers.</div></div></div>
                                        <div className="pr"><div className="pr-icon">🐟</div><div><div className="pr-title">Protein at every meal — 20–30g target</div><div className="pr-detail">Wild-caught fish, pasture-raised poultry. Protein supports thyroid hormone production.</div></div></div>
                                    </div>
                                )}

                                {activeProtocolTab === 'sup' && (
                                    <div className="pt-content on">
                                        <table className="stab">
                                            <thead><tr><th>Supplement</th><th>Dose</th><th>Why</th></tr></thead>
                                            <tbody>
                                                <tr><td style={{ fontWeight: 600 }}>Selenium</td><td>200mcg</td><td>T4→T3 conversion; reduces TPO antibodies</td></tr>
                                                <tr><td style={{ fontWeight: 600 }}>Magnesium glycinate</td><td>300–400mg</td><td>Sleep, mood, gut motility</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 6: MESSAGES SCREEN ═══════════════════════ */}
                    {currentScreen === 'messages' && (
                        <>
                            <div className="ph">
                                <div className="ph-title">Messages</div>
                                <div className="ph-sub">Your Allvi care team · Responds within 24 hours</div>
                            </div>
                            <div className="card">
                                <div className="mt" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="msg p"><div className="mb">I think the iron is constipating me. Should I stop taking it?</div><div className="mm">Rashmi · Sat 25 Apr, 2:14pm</div></div>
                                    <div className="msg a"><div className="mb">Don't stop — this is expected in the first 1–2 weeks on 50mg. Iron draws water into the colon and slows gut motility, especially at this dose. You're on ferrous bisglycinate which has the lowest GI side effect profile available.</div><div className="mm">Allvi Care Team · Sat 25 Apr, 4:02pm</div></div>
                                </div>
                                <div className="mir">
                                    <input className="mi" type="text" placeholder="Ask anything — protocol questions, symptoms, what a result means…" />
                                    <button className="ms">Send</button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* CLINICAL INQUIRY ACTION TERMINAL OVERLAY */}
            {isModalOpen && (
                <div className="no-print" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(31,41,55,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '460px', padding: 0, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#0F4C5C', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={18} /><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 600, margin: 0 }}>Clinical Support Pipeline</h3></div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', marginBottom: '8px' }}>Operational Inquiry Parameters</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detail current tracking status updates or programmatic clinical inquiries..." className="ta" style={{ width: '100%', minHeight: '120px', marginBottom: '16px' }} />
                            <button onClick={handleAppointmentSubmit} disabled={sending || !notes.trim()} className="sub-btn" style={{ opacity: (sending || !notes.trim()) ? 0.6 : 1 }}>
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Submit Message Parameters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;