import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, UNSAFE_createClientRoutesWithHMRRevalidationOptOut } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import Papa from 'papaparse';
import {
    Activity, FileUp, Info, Calendar, Send, X, Loader2, FlaskConical, Search,
    ChevronDown, ChevronUp, AlertTriangle, ClipboardList, FilePlus, CheckCircle2,
    FileText, LayoutDashboard, CheckSquare, BarChart2, BookOpen, MessageSquare, PhoneCall, Printer, LogOut, Menu, PanelLeftOpen, PanelLeftClose
} from 'lucide-react';
import AIInsights from '../AIInsights';
import WeeklyReport from './WeeklyReport';
import WhatsNextCard from './WhatsNextCard';
import AdvocacyDoc from './AdvocacyDoc';
import MyProtocol from './MyProtocol';

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
            hba1c: { label: '%', range: [4.0, 5.6], optimal: [4.0, 5.3], note: 'Prediabetes: 5.7–6.4%' },
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
    const [data, setData] = useState({ labs: [], symptoms: [], specialistReviews: [], whatsnext: [] });
    const [demographics, setDemographics] = useState({ name: '—', age: '—', gender: '—', goal: 'general' });
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [sending, setSending] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('dashboard');
    const [activeProtocolTab, setActiveProtocolTab] = useState('nut');
    const [intakeData, setIntakeData] = useState(null);
    const [checkedItems, setCheckedItems] = useState([]);
    const [streak, setStreak] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Helper to handle checklist toggles
    const toggleChecked = (item) => {
        setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    // State mechanics for internal subjective monitoring checks
    const [checkinForm, setCheckinForm] = useState({
        energy: 0, mood: 0, sleep: 0, stress: 0,
        symptoms: [],
        bm: '',
        bristol: '',
        diet: '',
        supplements: [],
        notes: ''
    });

    const [messages, setMessages] = useState([
        { sender: 'patient', text: 'I think the iron is constipating me. Should I stop taking it?', time: 'Rashmi · Sat 25 Apr, 2:14pm' },
        { sender: 'team', text: 'Don\'t stop — this is expected in the first 1–2 weeks on 50mg. Iron draws water into the colon...', time: 'Allvi Care Team · Sat 25 Apr, 4:02pm' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const getChartData = () => {
        if (!data.symptoms || data.symptoms.length === 0) return [];
        return data.symptoms.map((s, index) => ({
            name: `W${index + 1}`,
            energy: s.energy ? parseFloat(s.energy) : null,
            mood: s.mood ? parseFloat(s.mood) : null,
            sleep: s.sleep ? parseFloat(s.sleep) : null
        }));
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setMessages([...messages, {
            sender: 'patient',
            text: newMessage,
            time: `${demographics.name || 'Rashmi'} · Just now`
        }]);
        setNewMessage('');
    };

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
            const res = await axios.get(`${baseURL}/api/patient/dashboard/${activePatientId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('allvi_auth_token')}` }
            });
            if (res.data.success) {
                console.log(res.data)
                setData({
                    labs: res.data.labs,
                    symptoms: res.data.symptoms,
                    specialistReviews: res.data.specialistReviews,
                    whatsnext: res.data.whats_next

                });
                if (res.data.profile) {
                    setDemographics({
                        name: res.data.profile.full_name || 'Patient',
                        gender: res.data.profile.gender || '—',
                        goal: res.data.intake.goals || 'general'
                    });
                }
                setCheckinForm(prev => ({
                    ...prev,
                    energy: res.data.symptoms?.[res.data.symptoms.length - 1]?.energy ?? prev.energy,
                    mood: res.data.symptoms?.[res.data.symptoms.length - 1]?.mood ?? prev.mood,
                    sleep: res.data.symptoms?.[res.data.symptoms.length - 1]?.sleep ?? prev.sleep,
                    stress: res.data.symptoms?.[res.data.symptoms.length - 1]?.stress ?? prev.stress,
                }));
                setIntakeData(res.data.intake);
                setMessages(res.data.messages || []);
                setStreak(res.data.streak || 0);
            }
        } catch (err) {
            console.error("Dashboard fetch operational safeguard hit:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

const handleRequestAppointment = async () => {
    try {


        // 🚀 Extract token from localStorage
        const token = localStorage.getItem('allvi_auth_token');

        // 🛡️ Pass headers as the third argument in axios.post
        await axios.post(
            `${baseURL}/api/patient/request-appointment`, 
            { 
                patientId: activePatientId, 
                notes 
            }, 
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        alert("Strategic message dispatched to support@allvihealth.com!");
        setIsModalOpen(false);
        setNotes('');
    } catch (error) {
        console.error("❌ Error dispatching appointment request:", error);
        alert(error.response?.data?.error || "Failed to submit request.");
    }
};

    const handleCheckinSubmit = async () => {
        try {
            const payload = {
                patient_id: activePatientId,
                checkin_date: new Date().toISOString().split('T')[0],
                energy_score: parseInt(checkinForm.energy),
                mood_score: parseInt(checkinForm.mood),
                sleep_score: parseInt(checkinForm.sleep),
                stress_score: parseInt(checkinForm.stress),
                symptoms_reported: checkinForm.symptoms,
                free_text: checkinForm.notes
            };

            await axios.post(`${baseURL}/api/patient/checkin`, payload, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('allvi_auth_token')}` }
            });

            alert("Daily Metric Log Captured Successfully!");
            await fetchDashboardData();
            setCurrentScreen('dashboard');
        } catch (err) {
            console.error("Check-in Error Detail:", err.response?.data || err.message);
            alert(`Failed to save biometric logs: ${err.response?.data?.error || err.message}`);
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

    // 1. Add this ref inside your Dashboard component
    const fileInputRef = useRef(null);

    // 2. Add this handler function inside your Dashboard component
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Change the URL to match your backend route (e.g., /api/patient/upload-lab)
            const response = await axios.post(`${baseURL}/api/patient/labs/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('allvi_auth_token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                alert("Lab result parsed and saved successfully!");
                // Refresh dashboard data to show the new rows in the Lab Record table
                await fetchDashboardData();
            }
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to process lab result.");
        }
    };

    const toggleItem = (field, item) => {
        setCheckinForm(prev => {
            const list = prev[field] || [];
            const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
            return { ...prev, [field]: newList };
        });
    };

    const setOption = (field, value) => {
        setCheckinForm(prev => ({ ...prev, [field]: value }));
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

    const latestSymptomRow = data.symptoms && data.symptoms.length > 0 ? data.symptoms[data.symptoms.length - 1] : null;
    const historicalSymptomRow = data.symptoms && data.symptoms.length > 1 ? data.symptoms[data.symptoms.length - 2] : null;

    const evaluateTrend = (currentVal, pastRow, metricField) => {
        if (currentVal === undefined || currentVal === null) return "No data logged";
        if (!pastRow || pastRow[metricField] === undefined) return "→ stable snapshot";
        const delta = currentVal - pastRow[metricField];
        if (delta > 0) return `↑ up from ${pastRow[metricField]}`;
        if (delta < 0) return `↓ down from ${pastRow[metricField]}`;
        return "→ stable vs last entry";
    };

    // ─── UNIFIED DATA EXTRACTION LOGIC ENGINE ───

    const lookupMarkerMetadata = (markerKey, registry) => {
        for (const [, category] of Object.entries(registry)) {
            if (category.markers[markerKey]) return category.markers[markerKey];
        }
        return null;
    };
    const getFormattedDate = () => {
        const today = new Date();

        const options = {
            weekday: 'long',  // "Sunday"
            day: 'numeric',   // "11"
            month: 'long',    // "May"
            year: 'numeric'   // "2026"
        };

        // Format options using British/International locale rules to omit commas between day and month
        return today.toLocaleDateString('en-GB', options);
    };

    const formatRowLabel = (markerKey, metaObject) => {
        if (metaObject) return metaObject.label;
        return markerKey.toUpperCase().replace(/_/g, ' ');
    };

    const parseRowStatus = (trafficStatus, defaultCfg) => {
        const cfg = defaultCfg[trafficStatus] || defaultCfg.green;
        let text = '✓ In range';
        if (trafficStatus === 'amber') text = '⚠ Low-normal';
        if (trafficStatus === 'red') text = '⚠ Low';
        return { text, bg: cfg.bg, color: cfg.text };
    };

    const calculateDeltaVector = (currentVal, historicalRow, markerKey) => {
        if (currentVal === undefined || currentVal === null || !historicalRow || historicalRow[markerKey] === undefined) {
            return { icon: '→', cssColor: '#6B7280' };
        }
        const delta = currentVal - historicalRow[markerKey];
        if (delta > 0) return { icon: '↑', cssColor: '#2D6A4F' };
        if (delta < 0) return { icon: '↓', cssColor: '#9B2226' };
        return { icon: '→', cssColor: '#6B7280' };
    };

    const dynamicEnergy = latestSymptomRow?.energy !== undefined ? latestSymptomRow.energy : 0;
    const dynamicMood = latestSymptomRow?.mood !== undefined ? latestSymptomRow.mood : 0;
    const dynamicSleep = latestSymptomRow?.sleep !== undefined ? latestSymptomRow.sleep : 0;
    const dynamicStress = latestSymptomRow?.stress !== undefined ? latestSymptomRow.stress : 0;

    // Programmatically calculate total tracked records count based on state payload depth
    const totalDaysTracked = data.symptoms?.length || 75;
    const computedWeekNumber = Math.max(1, Math.ceil(totalDaysTracked / 7));

    if (loading) {
        return (
            <div style={{ backgroundColor: '#F7F1E8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F4C5C', fontWeight: 600, justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" size={24} /> Loading care registry record telemetry...
                </div>
            </div>
        );
    }

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
    
    .layout { display: flex; min-height: calc(100vh - 64px); position: relative; }
    .sidebar { width: 220px; min-width: 220px; background: #FFFFFF; border-right: 1px solid rgba(15,76,92,0.08); padding: 24px 0; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; flex-shrink: 0; text-align: left; transition: transform 0.3s ease; z-index: 90; }
    .si-section { padding: 16px 20px 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(107,114,128,0.7); }
    .si { display: flex; align-items: center; gap: 10px; padding: 11px 20px; font-size: 14px; font-weight: 500; color: #6B7280; cursor: pointer; border-left: 3px solid transparent; transition: all 0.15s; }
    .si:hover { background: #E8F4F7; color: #0F4C5C; }
    .si.on { background: #E8F4F7; color: #0F4C5C; border-left-color: #0F4C5C; font-weight: 600; }
    .si-icon { width: 20px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    
    .main { flex: 1; padding: 32px; max-width: 100%; text-align: left; box-sizing: border-box; }

    /*cards */ 

    .card { background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); margin-bottom: 24px; max-height: 100%; }
    .card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--charcoal);margin-bottom:16px;}

    .ph { margin-bottom: 28px; }
    .ph-title { font-family: 'Playfair Display', "serif"; font-size: 26px; font-weight: 600; color: #1F2937; }
    .ph-sub { font-size: 14px; color: #6B7280; margin-top: 4px; }
    .g4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .kpi { background: #FFFFFF; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); border: 1px solid rgba(15,76,92,0.06); position: relative; overflow: hidden; }
    .kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #0F4C5C; }
    .kpi.am::before { background: #C97B2E; }
    .kpi.gr::before { background: #2D6A4F; }
    .kpi-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; margin-bottom: 8px; }
    .kpi-val { font-family: 'Playfair Display',"serif"; font-size: 36px; font-weight: 400; color: #0F4C5C; line-height: 1; }
    .kpi-val.am { color: #C97B2E; }
    .kpi-val.gr { color: #2D6A4F; }
    .kpi-sub { font-size: 12px; color: #6B7280; margin-top: 6px; }
    
    .cb { background: #0F4C5C; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; cursor: pointer; gap: 16px; }
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
    .sub-btn { width: 100%; background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; display:flex; justify-content: center}
    .ta { width: 100%; min-height: 80px; padding: 12px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-family: inherit; font-size: 14px; color: #1F2937; background: #F7F1E8; resize: vertical; outline: none; line-height: 1.5; }
    
    .sl-row { margin-bottom: 24px; }
    .sl-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .sl-name { font-size: 14px; font-weight: 500; color: #1F2937; }
    .sl-val { font-size: 16px; font-weight: 700; color: #0F4C5C; font-family: 'Playfair Display', serif; }
    .sl-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: #6B7280; margin-top: 4px; }
    input[type=range] { width: 100%; height: 6px; border-radius: 3px; background: #EDE7DB; appearance: none; outline: none; cursor: pointer; }
    input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; background: #0F4C5C; border-radius: 50%; cursor: pointer; border: 2px solid #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    
    .pt-tabs { display: flex; gap: 0; border-bottom: 2px solid #EDE7DB; margin-bottom: 20px; overflow-x: auto; }
    .pt-tab { padding: 10px 18px; font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; transition: all 0.15s; }
    .pt-tab.on { color: #0F4C5C; border-bottom-color: #0F4C5C; font-weight: 600; }
    .pt-content { display: none; }
    .pt-content.on { display: block; }
    .pr { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #EDE7DB; }
    .pr-icon { font-size: 18px; flex-shrink: 0; width: 28px; text-align: center; }
    .pr-title { font-size: 14px; font-weight: 600; color: #1F2937; margin-bottom: 3px; }
    .pr-detail { font-size: 13px; color: #6B7280; line-height: 1.5; }
    .stab { width: 100%; border-collapse: collapse; }
    .stab th { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6B7280; padding: 8px 10px; text-align: left; border-bottom: 2px solid #EDE7DB; }
    .stab td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #F7F1E8; vertical-align: top; }
    .cl-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #EDE7DB; }
    .cb-box { width: 18px; height: 18px; border: 2px solid #6B7280; border-radius: 4px; flex-shrink: 0; margin-top: 1px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 11px; }
    .cb-box.done { background: #2D6A4F; border-color: #2D6A4F; color: white; }
    
    .mt { display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 72%; }
    .msg.p { align-self: flex-end; }
    .msg.a { align-self: flex-start; }
    .mb { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
    .p .mb { background: #0F4C5C; color: #F7F1E8; border-bottom-right-radius: 4px; }
    .a .mb { background: #FFFFFF; color: #1F2937; border: 1px solid rgba(15,76,92,0.1); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(15,76,92,0.08); }
    .mm { font-size: 11px; color: #6B7280; margin-top: 4px; padding: 0 4px; }
    .p .mm { text-align: right; }
    .mir { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #EDE7DB; }
    .mi { flex: 1; padding: 11px 16px; border: 1px solid rgba(15,76,92,0.15); border-radius: 8px; font-family: inherit; font-size: 14px; background: #F7F1E8; color: #1F2937; outline: none; }
    .ms { background: #0F4C5C; color: #F7F1E8; border: none; border-radius: 8px; padding: 11px 18px; font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer; }
    /* Add these lines inside the __html template string in your code */
    .sg { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .supp { position: relative; display: flex; align-items: center; background-color : #F7F1E8; border: 1px solid #F0ECE3; border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 500; cursor: help; }
    .supp .tt { visibility: hidden; width: 240px; background-color: #1F2937; color: #fff; text-align: left; border-radius: 6px; padding: 8px 12px; position: absolute; z-index: 10; bottom: 125%; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.2s; font-size: 11px; line-height: 1.4; font-weight: 400; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .supp:hover .tt { visibility: visible; opacity: 1; }
    .sd { width: 8px; height: 8px; background-color: #2D6A4F; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
    .sd.am { background-color: #F59E0B; }
    .sd-days { margin-left: auto; color: #6B7280; font-size: 12px; font-weight: 600; }
    .pb { width: 100%; height: 6px; background-color: #ECE9E1; border-radius: 10px; overflow: hidden; }
    .pb-fill { height: 100%; background-color: #0F4C5C; border-radius: 10px; }
    .mobile-menu-toggle { display: none; background: none; border: none; color: #F7F1E8; cursor: pointer; padding: 4px; align-items: center; justify-content: center; }
    .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 85; backdrop-filter: blur(2px); }
    /* ─── CUSTOM CLINICAL TABLE STYLES ─── */
    .lt { width: 100%; border-collapse: collapse; text-align: left; }
    .lt th { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #6B7280; padding: 8px 12px; text-align: left; border-bottom: 1px solid #EDE7DB; }
    .lt td { padding: 12px; font-size: 13px; border-bottom: 1px solid #EDE7DB; color: #1F2937; }
    .lt tr:last-child td { border-bottom: none; }
    .lb { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .lb.gr { background: #D1FAE5; color: #065F46; }
    .lb.am { background: #FEF3C7; color: #92400E; }
    /* ─── WHAT'S NEXT COMPONENT UTILITIES ─── */
    .at { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; display: inline-block; white-space: nowrap; margin-top: 2px; text-align: center; min-width: 65px; }
    .at.w { background: #FDF3E7; color: #C97B2E; }
    .at.o { background: #E8F4F7; color: #0F4C5C; }
    .at.d { background: #EAF5EE; color: #2D6A4F; }
    .at-text { fontSize: 13px; color: #1F2937; line-height: 1.5; }

    .mobile-menu-toggle { display: none; background: none; border: none; color: #F7F1E8; cursor: pointer; padding: 4px; align-items: center; justify-content: center; }
    @media (max-width: 768px) {
        .mobile-menu-toggle { display: flex; }
        .sidebar { position: fixed; left: 0; top: 64px; height: calc(100vh - 64px); transform: translateX(-100%); box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
        .sidebar.open { transform: translateX(0); }
        .sidebar-overlay.open { display: block; }
        .g2 { grid-template-columns: 1fr; gap: 16px; }
        .main { padding: 16px; }
        .cb { flex-direction: column; align-items: flex-start; }
        .cb-btn { width: 100%; text-align: center; }
        .nav { padding: 0 16px; }
        .nav-streak { font-size: 11px; padding: 4px 10px; }
    }
    `}} />

            {/* TOP BAR BRAND ENGINE NAVIGATION */}
            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <PanelLeftClose size={24} className="door-icon transition-close" /> : <PanelLeftOpen size={24} className="door-icon transition-open" />}
                    </button>
                    <div className="nav-logo">
                        Allvi <span>Reimagined Patient Care</span>
                    </div>
                </div>

                <div className="nav-right">
                    <div className="nav-streak">🔥 <strong>{streak}</strong> day streak</div>

                    <div className="nav-avatar"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ cursor: 'pointer', position: 'relative', textTransform: 'uppercase' }}>
                        {demographics.name?.charAt(0) || 'NA'}

                        {isMenuOpen && (
                            <div style={{
                                position: 'absolute', top: '50px', right: '0',
                                background: '#FFFFFF', borderRadius: '8px',
                                boxBurial: '0 4px 12px rgba(0,0,0,0.15)',
                                color: '#1F2937', minWidth: '140px',
                                padding: '8px 0', zIndex: 1000
                            }}>
                                <div className="si" style={{ padding: '8px 16px', borderLeft: 'none' }}>Profile</div>
                                <div className="si" onClick={handleLogout} style={{ padding: '8px 16px', color: '#9B2226', borderLeft: 'none' }}>
                                    <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="layout">
                <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />

                {/* SIDEBAR NAVIGATION PANEL */}
                <aside className={`sidebar no-print ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="si-section">Overview</div>
                    <div className={`si ${currentScreen === 'dashboard' ? 'on' : ''}`} onClick={() => { setCurrentScreen('dashboard'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">⊞</span> Dashboard
                    </div>
                    <div className={`si ${currentScreen === 'checkin' ? 'on' : ''}`} onClick={() => { setCurrentScreen('checkin'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">✓</span> Daily Check-In
                    </div>

                    <div className="si-section">Reports</div>
                    <div className={`si ${currentScreen === 'reports' ? 'on' : ''}`} onClick={() => { setCurrentScreen('reports'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">📋</span> Weekly Reports
                    </div>
                    <div className={`si ${currentScreen === 'advocacy' ? 'on' : ''}`} onClick={() => { setCurrentScreen('advocacy'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">📄</span> Advocacy Doc
                    </div>

                    <div className="si-section">Health</div>
                    <div className={`si ${currentScreen === 'labs' ? 'on' : ''}`} onClick={() => { setCurrentScreen('labs'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">🧪</span> Lab Results
                    </div>
                    <div className={`si ${currentScreen === 'protocol' ? 'on' : ''}`} onClick={() => { setCurrentScreen('protocol'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">💊</span> My Protocol
                    </div>
                    <div className={`si ${currentScreen === 'insights' ? 'on' : ''}`} onClick={() => { setCurrentScreen('insights'); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><FlaskConical size={16} /></span> Health Insights
                    </div>

                    <div className="si-section">Support</div>
                    <div className={`si ${currentScreen === 'messages' ? 'on' : ''}`} onClick={() => { setCurrentScreen('messages'); setIsSidebarOpen(false); }}>
                        <span className="si-icon">💬</span> Messages
                    </div>
                    <div className="si" onClick={() => { setIsModalOpen(true); setIsSidebarOpen(false); }}>
                        <span className="si-icon"><PhoneCall size={16} /></span> Book a Call
                    </div>

                    <div className="si-section" style={{ marginTop: 'auto' }}>Account</div>
                    <div className="si" onClick={handleLogout}>
                        <span className="si-icon"><LogOut size={16} /></span> Logout
                    </div>
                </aside>

                {/* PRIMARY SUB-SCREEN ROUTING SYSTEM CONTROLLER */}
                <main className="main">

                    {/* ═══════════════════════ SCREEN 1: CORE DASHBOARD HUB ═══════════════════════ */}
                    {currentScreen === 'dashboard' && (
                        <>
                            <div className="ph">
                                <h1 className="ph-title">Hello, {demographics.name || 'Patient'}</h1>
                                <p className="ph-sub"><strong>Patient ID: </strong>{activePatientId} <br /> <strong>Goals: </strong>{demographics.goal || 'General Health'}</p>
                            </div>

                            <div className="cb" onClick={() => setCurrentScreen('checkin')}>
                                <div>
                                    <h3>Today's check-in is ready</h3>
                                    <p>Takes under 3 minutes · Personalised from yesterday's entry</p>
                                </div>
                                <button className="cb-btn">Check In Now →</button>
                            </div>

                            <div className="g4">
                                <div className="kpi">
                                    <div className="kpi-label">Energy</div>
                                    <div className="kpi-val">{dynamicEnergy}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicEnergy, historicalSymptomRow, 'energy')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Mood</div>
                                    <div className="kpi-val">{dynamicMood}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicMood, historicalSymptomRow, 'mood')}</div>
                                </div>
                                <div className="kpi gr">
                                    <div className="kpi-label">Sleep</div>
                                    <div className="kpi-val">{dynamicSleep}</div>
                                    <div className="kpi-sub">{evaluateTrend(dynamicSleep, historicalSymptomRow, 'sleep')}</div>
                                </div>
                                <div className="kpi am">
                                    <div className="kpi-label">Stress</div>
                                    <div className="kpi-val ">{dynamicStress}</div>
                                    <div className="kpi-sub" style={{ color: dynamicStress <= 2 ? '#2D6A4F' : '#9B2226' }}>
                                        {dynamicStress <= 1.5 && latestSymptomRow ? "↓ programme low" : evaluateTrend(dynamicStress, historicalSymptomRow, 'stress')}
                                    </div>
                                </div>
                            </div>

                            <div className="g2">
                                <div className="card" style={{ minWidth: 0 }}>
                                    <div className="card-title">{totalDaysTracked ? `${computedWeekNumber}-Week Trend` : "11-Week Trend"}</div>

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F4C5C' }}></div>Energy</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2D6A4F' }}></div>Mood</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6B7280' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C97B2E' }}></div>Sleep</div>
                                    </div>

                                    <div style={{ width: '100%', height: 160 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.symptoms.map((s, i) => ({
                                                name: `W${i + 1}`,
                                                energy: parseFloat(s.energy),
                                                mood: parseFloat(s.mood),
                                                sleep: parseFloat(s.sleep)
                                            }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DB" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                                                <Line connectNulls type="monotone" dataKey="energy" stroke="#0F4C5C" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="mood" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                                <Line connectNulls type="monotone" dataKey="sleep" stroke="#C97B2E" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-title">Patterns & Insights</div>
                                    <div className="ic gr"><div className="ic-tag gr">✓ Positive</div><div className="ic-title">Stress at programme low</div><div className="ic-body">{dynamicStress} — lowest in {computedWeekNumber} weeks. Even with GI changes, your nervous system is stable.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Watch</div><div className="ic-title">Evening exercise timing</div><div className="ic-body">Sat evening pickleball → Sun energy 7. Daytime sessions perform better for you.</div></div>
                                    <div className="ic am"><div className="ic-tag am">⚠ Monitor</div><div className="ic-title">GI — iron protocol Week 1</div><div className="ic-body">Expected adjustment. Increase hydration on iron days. Should resolve by Week 2.</div></div>
                                </div>
                            </div>

                            <PatientReviewView reviews={data.specialistReviews} />
                            {/* ═══════════════════════ STYLED LAB RECORD CONTAINER ═══════════════════════ */}

                            <div className="g2">
                                {/* CARD 1: SUPPLEMENT COMPLIANCE MATRIX CONTAINER */}
                                <div className="card">
                                    <div className="card-title">Supplement Compliance — This Week</div>
                                    <div className="sg">
                                        <div className="supp"><div className="sd"></div>Selenium 200mcg<span className="sd-days">5/5</span><div class="tt">Essential for T4→T3 conversion. Shown to reduce TPO antibodies over time.</div></div>
                                        <div className="supp"><div class="sd"></div>Magnesium (eve)<span class="sd-days">5/5</span><div class="tt">Sleep, mood, gut motility, muscle relaxation. Take 30–60 mins before bed.</div></div>
                                        <div className="supp"><div class="sd"></div>B12 + K2<span class="sd-days">5/5</span><div class="tt">Energy, mood. K2 supports bone health alongside D3.</div></div>
                                        <div className="supp"><div class="sd"></div>Omega-3<span class="sd-days">5/5</span><div class="tt">Anti-inflammatory. May reduce TPO antibodies. Supports brain health and mood.</div></div>
                                        <div className="supp"><div class="sd"></div>Multivitamin<span class="sd-days">5/5</span><div class="tt">Broad micronutrient support. Take with food.</div></div>
                                        <div className="supp"><div class="sd am"></div>Iron 50mg (alt)<span class="sd-days">4/5</span><div class="tt">Ferritin at 19 → target 70–90. Alt day dosing maximises absorption via hepcidin reset. Empty stomach + Vit C.</div></div>
                                        <div className="supp"><div class="sd"></div>Zinc 15mg<span class="sd-days">5/5</span><div class="tt">T4→T3 conversion, immune function, hair health.</div></div>
                                        <div className="supp"><div class="sd"></div>Curcumin 500mg<span class="sd-days">5/5</span><div class="tt">Supports T-regulatory immune response. Helps modulate autoimmune inflammation.</div></div>
                                    </div>
                                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #EDE7DB' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                                            <span>Diet compliance</span>
                                            <span style={{ fontWeight: 600, color: '#10B981' }}>5/5 days — 100%</span>
                                        </div>
                                        <div className="pb"><div className="pb-fill" style={{ width: '100%' }}></div></div>
                                    </div>
                                </div>

                                {/* CARD 2: REFACTORED LIVE LAB RECORD PANEL */}
                                <div className="card">
                                    {/* Serif Heading to match style guide font hierarchy */}
                                    <div className="card-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '16px' }}>
                                        Lab Record
                                    </div>

                                    <table className="lt" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th>Test</th>
                                                <th >Latest</th>
                                                <th >Status</th>
                                                <th >Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getDynamicBiomarkers().map((markerKey) => {
                                                const rawValue = mergedLabData[markerKey];
                                                const meta = lookupMarkerMetadata(markerKey, MARKER_REGISTRY);

                                                // 🚀 1. Resolves shortcut database keys into full registry names dynamically
                                                const labelText = formatRowLabel(markerKey, meta);
                                                const measurementUnit = meta?.unit || '';
                                                const dataValueText = rawValue !== undefined && rawValue !== null && rawValue !== ''
                                                    ? `${rawValue} ${measurementUnit}`.trim()
                                                    : '—';

                                                // 2. Parse mockup traffic classes dynamically from registry variables
                                                const trafficStatus = meta ? getTrafficLight(rawValue, meta) : 'green';
                                                const uiStatus = parseRowStatus(trafficStatus, TRAFFIC_CFG);

                                                // 3. Compute metric trend directional vector arrows via logical parsing utility
                                                const uiTrend = calculateDeltaVector(rawValue, historicalSymptomRow, markerKey);
                                                const isDownTrend = uiTrend.icon === '↓' || uiTrend.icon?.includes('down');
                                                const isUpTrend = uiTrend.icon === '↑' || uiTrend.icon?.includes('up');

                                                // Determine badge text variations based on status to match mockup exactly
                                                let statusLabel = '✓ In range';
                                                if (trafficStatus === 'amber') statusLabel = '⚠️ Low-normal';
                                                if (trafficStatus === 'red') statusLabel = '⚠️ Low';

                                                return (
                                                    <tr key={markerKey}>
                                                        {/* 🚀 Dynamic Label Cell: Standardized font weighting and color scheme matching the mockup */}
                                                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--charcoal)', borderBottom: '1px solid var(--ivory)', textTransform: 'capitalize' }}>
                                                            {labelText}
                                                        </td>
                                                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--charcoal)', borderBottom: '1px solid var(--ivory)', fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
                                                            {dataValueText}
                                                        </td>
                                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--ivory)' }}>
                                                            <span
                                                                className={`lb ${trafficStatus === 'amber' || trafficStatus === 'red' ? 'am' : 'gr'}`}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '10px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    backgroundColor: uiStatus.bg,
                                                                    color: uiStatus.color
                                                                }}
                                                            >
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', borderBottom: '1px solid var(--ivory)', fontWeight: 'bold', fontSize: '16px', color: isDownTrend ? 'var(--red)' : isUpTrend ? 'var(--green)' : 'var(--grey)' }}>
                                                            {isDownTrend ? '↓' : isUpTrend ? '↑' : '→'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}


                                            {getDynamicBiomarkers().length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--grey)', padding: '24px', fontSize: '13px' }}>
                                                        No lab report metrics logged. Click upload to analyze biomarkers.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Footer Layer matching image_5a19e5.png perfectly */}
                                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--ivory-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--grey)' }}>
                                            Next retest: <strong style={{ color: 'var(--charcoal)', fontWeight: 600 }}></strong>
                                        </span>
                                        {/* Hidden input to handle the actual file selection */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />

                                        {/* Updated Button to trigger the hidden input */}
                                        <button
                                            className="btn-ghost"
                                            onClick={() => fileInputRef.current.click()}
                                            style={{
                                                fontSize: '13px',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            Upload Result
                                        </button>
                                    </div>
                                </div>
                            </div>



                            {/*<section style={{ marginBottom: '24px' }}>
                                <div style={{ borderBottom: '1px solid #EDE7DB', paddingBottom: '6px', marginBottom: '16px' }}>
                                    <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em' }}>Longitudinal Panel Tracking Timeline</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    {getDynamicBiomarkers().map(markerKey => (
                                        <ChartCard key={markerKey} title={markerKey} dataKey={markerKey} color="#0F4C5C" data={data.labs} />
                                    ))}
                                </div>
                            </section>

                            <section className="card">
                                <LabAnalysis labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} patientLabRanges={data.labRanges} />
                            </section>*/}

                            {/* MAIN DASHBOARD WHAT'S NEXT VIEW HUB */}
                            <div className='card'>

                                <WhatsNextCard
                                    whatsNextFeed={data?.whatsnext || []}
                                    loading={loading} // Uses your dashboard's active loading stat

                                />
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EDE7DB', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button className="btn-primary" onClick={() => setCurrentScreen('advocacy')}>
                                        Request Advocacy Doc
                                    </button>
                                    <button className="btn-ghost" onClick={() => setIsModalOpen(true)}>
                                        Enter Appointment Date
                                    </button>
                                    <button className="btn-ghost" onClick={() => setCurrentScreen('insights')}>
                                        See Health Insights
                                    </button>
                                </div>
                            </div>




                            {/*<section className="card">
                                <AIInsights patientId={activePatientId} labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} demographics={demographics} intake={intakeData} />
                            </section>*/}

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
                        <div className="screen on" style={{ display: 'block' }}>
                            <div className="ph">
                                <div className="ph-title">Daily Check-In</div>
                                <div className="ph-sub">
                                    {getFormattedDate()} · Yesterday you mentioned constipation. How are you feeling today?
                                </div>
                            </div>

                            <div className="card" style={{ marginBottom: '24px', background: '#FDF3E7', border: '1px solid #C97B2E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '20px' }}>💡</div>
                                <div style={{ fontSize: '13px', color: '#9B2226', fontWeight: 600 }}>
                                    Protocol Reminder: Remember to take your iron supplement on an empty stomach with Vitamin C today.
                                </div>
                            </div>

                            <div className="card">
                                {[
                                    { label: 'Energy', field: 'energy', icon: '⚡', low: 'Low', high: 'High' },
                                    { label: 'Mood', field: 'mood', icon: '♥', low: 'Low', high: 'High' },
                                    { label: 'Sleep quality', field: 'sleep', icon: '🌙', low: 'Poor', high: 'Excellent' },
                                    { label: 'Stress', field: 'stress', icon: '🍃', low: 'None', high: 'High' }
                                ].map(s => (
                                    <div className="sl-row" key={s.field}>
                                        <div className="sl-label">
                                            <span className="sl-name">{s.icon} {s.label}</span>
                                            <span className="sl-val">{checkinForm[s.field]}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="10" value={checkinForm[s.field]}
                                            onChange={(e) => setCheckinForm({ ...checkinForm, [s.field]: e.target.value })}
                                        />
                                        <div className="sl-range-labels">
                                            <span>{s.low}</span><span>{s.high}</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="cs-title">Symptoms today</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {['Fatigue', 'Constipation', 'Brain fog', 'Feeling cold', 'Joint pain', 'Hair loss', 'Anxiety', 'Low mood', 'Palpitations'].map(sym => (
                                        <div
                                            key={sym}
                                            className={`pill ${checkinForm.symptoms?.includes(sym) ? 'on' : ''}`}
                                            onClick={() => toggleItem('symptoms', sym)}
                                        >{sym}</div>
                                    ))}
                                </div>

                                <div className="cs-title">Bowel movement today?</div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                    {['Yes', 'No'].map(val => (
                                        <div key={val} className={`do ${checkinForm.bm === val ? 'on' : ''}`}
                                            onClick={() => setOption('bm', val)}>{val}</div>
                                    ))}
                                </div>

                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Bristol Stool Scale</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                    {['Type 1', 'Type 2', 'Type 3', 'Type 4', 'Type 5', 'Type 6', 'Type 7'].map(type => (
                                        <div key={type} className={`do ${checkinForm.bristol === type ? 'on' : ''}`}
                                            onClick={() => setOption('bristol', type)}>{type}</div>
                                    ))}
                                </div>

                                <div className="cs-title">Diet compliance today</div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {['Yes, fully', 'Mostly (small slip)', 'No (intentional)', 'No (accidental)'].map(opt => (
                                        <div key={opt} className={`do ${checkinForm.diet === opt ? 'on' : ''}`}
                                            onClick={() => setOption('diet', opt)}>{opt}</div>
                                    ))}
                                </div>

                                <div className="cs-title">Supplements taken today</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '24px' }}>
                                    {['Selenium 200mcg', 'Magnesium (eve)', 'B12 + K2', 'Omega-3', 'Iron 50mg (alt day)', 'Zinc 15mg'].map(supp => (
                                        <div
                                            key={supp}
                                            className={`pill ${checkinForm.supplements?.includes(supp) ? 'on' : ''}`}
                                            style={{ borderRadius: '8px', textAlign: 'center', padding: '10px', cursor: 'pointer' }}
                                            onClick={() => toggleItem('supplements', supp)}
                                        >
                                            {supp}
                                        </div>
                                    ))}
                                </div>

                                <div className="cs-title">Anything else to note?</div>
                                <textarea
                                    className="ta"
                                    value={checkinForm.notes}
                                    onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
                                    placeholder="How did you feel today? Any specific reactions?"
                                ></textarea>

                                <button className="sub-btn" onClick={handleCheckinSubmit}>Submit Check-In ✓</button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════ SCREEN 3: WEEKLY REPORT SCREEN ═══════════════════════ */}
                    {currentScreen === 'reports' && (
                        <WeeklyReport
                            computedWeekNumber={computedWeekNumber}
                            totalDaysTracked={totalDaysTracked}
                            data={data}
                            mergedLabData={mergedLabData}
                            dynamicEnergy={dynamicEnergy}
                            dynamicMood={dynamicMood}
                            dynamicSleep={dynamicSleep}
                            dynamicStress={dynamicStress}
                            latestSymptomRow={latestSymptomRow}
                            historicalSymptomRow={historicalSymptomRow}
                            evaluateTrend={evaluateTrend}
                        />
                    )}
                    {/* ═══════════════════════ SCREEN 4: APPOINTMENT ADVOCACY DOC ═══════════════════════ */}
                    {currentScreen === 'advocacy' && (
                        <AdvocacyDoc
                            demographics={demographics}
                            intakeData={intakeData}
                            totalDaysTracked={totalDaysTracked}
                            data={data}
                            mergedLabData={mergedLabData}
                            dynamicStress={dynamicStress}
                            MARKER_REGISTRY={MARKER_REGISTRY}
                            getTrafficLight={getTrafficLight}
                            TRAFFIC_CFG={TRAFFIC_CFG}
                        />
                    )}

                    {/* ═══════════════════════ SCREEN 5: Lab Results SCREEN ═══════════════════════ */}
                    {currentScreen === "labs" && (
                        <>
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

                            <section className="card">
                                <LabAnalysis labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} patientLabRanges={data.labRanges} />
                            </section>



                        </>
                    )}

                    {/* ═══════════════════════ SCREEN 6: MY PROTOCOL SCREEN ═══════════════════════ */}
                    {currentScreen === 'protocol' && (
                        <MyProtocol
                            data={data}
                            totalDaysTracked={totalDaysTracked}
                            activeProtocolTab={activeProtocolTab}
                            setActiveProtocolTab={setActiveProtocolTab}
                            checkedItems={checkedItems}
                            toggleChecked={toggleChecked}
                        />
                    )}

                    {/* ═══════════════════════ SCREEN 7: Health Insights SCREEN ═══════════════════════ */}
                    {currentScreen === "insights" && (

                        <section className="card">
                            <AIInsights patientId={activePatientId} labData={getMergedLabData()} patientGoal={demographics.goal || 'general'} demographics={demographics} intake={intakeData} />
                        </section>
                    )}

                    {/* ═══════════════════════ SCREEN 8: MESSAGES SCREEN ═══════════════════════ */}
                    {currentScreen === 'messages' && (
                        <>
                            <div className="ph">
                                <div className="ph-title">Messages</div>
                                <div className="ph-sub">Your Allvi care team · Responds within 24 hours · Clinical queries reviewed by clinician</div>
                            </div>

                            <div className="card">
                                <div className="mt">
                                    {messages.map((msg, index) => (
                                        <div key={index} className={`msg ${msg.sender === 'patient' ? 'p' : 'a'}`} style={{ width: '100%' }}>
                                            <div className="mb">{msg.text}</div>
                                            <div className="mm">{msg.time}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mir">
                                    <input
                                        className="mi"
                                        type="text"
                                        placeholder="Ask anything — protocol questions, symptoms, what a result means…"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button className="ms" onClick={handleSendMessage}>Send</button>
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
                            <button onClick={handleRequestAppointment} disabled={sending || !notes.trim()} className="sub-btn" style={{ opacity: (sending || !notes.trim()) ? 0.6 : 1 }}>
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} className="inline mr-2" />} Submit Message Parameters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;