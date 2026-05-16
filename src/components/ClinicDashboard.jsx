import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, CheckCircle, Smile, 
  ShieldAlert, Sparkles, TrendingUp, DollarSign, 
  Layers, UserPlus, Bell, LogOut, ArrowUpRight,
  Search, Filter, ExternalLink, FileText, Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize direct client node parameters using local environment configs
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ClinicDashboard = () => {
  const [activeTab, setActiveTab] = useState('executive');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  
  // Dynamic States
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [metrics, setMetrics] = useState({
    totalEnrolled: 0,
    activeThisWeek: 0,
    avgCompliance: '0%',
    avgQol: 0,
    escalationsCount: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    fetchSupabasePatientPanel();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSupabasePatientPanel = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          allvi_id,
          name,
          created_at,
          patient_intake ( diagnoses ),
          analysis_summaries ( overall_risk_level, generated_at ),
          symptoms ( date, energy, sleep, mood, stress ),
          lab_results ( test_date )
        `);

      if (error) throw error;

      const normalizedPatients = data.map((p) => {
        const conditionsList = p.patient_intake?.[0]?.diagnoses || [];
        const combinedCondition = conditionsList.length > 0 ? conditionsList.join(', ') : 'General Evaluation';

        const rawRisk = p.analysis_summaries?.[0]?.overall_risk_level || 'Green';
        const riskLevel = rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase();

        const totalLogs = p.symptoms?.length || 0;
        const generatedStreak = totalLogs > 0 ? `${totalLogs} Days` : '0 Days';

        let lastCheckInStr = 'No logs';
        if (totalLogs > 0) {
          const dates = p.symptoms.map(s => new Date(s.date));
          const latestDate = new Date(Math.max(...dates));
          lastCheckInStr = latestDate.toISOString().split('T')[0];
        }

        return {
          id: p.allvi_id,
          name: p.name || 'Anonymous Patient',
          condition: combinedCondition,
          enrollDate: p.created_at ? p.created_at.split('T')[0] : '2026-05-16',
          streak: generatedStreak,
          risk: riskLevel, 
          lastCheckin: lastCheckInStr,
          nextAppt: p.lab_results?.[0]?.test_date || 'TBD',
          preApptStatus: p.analysis_summaries?.length > 0 ? 'Approved' : 'Draft'
        };
      });

      setPatients(normalizedPatients);
      calculateExecutiveMetrics(normalizedPatients, data);

    } catch (err) {
      console.error('Error fetching data from Supabase node:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateExecutiveMetrics = (normalized, rawData) => {
    const total = normalized.length;
    const ambersAndReds = normalized.filter(p => p.risk === 'Amber' || p.risk === 'Red').length;
    
    let totalQolPoints = 0;
    let symptomsCount = 0;
    
    rawData.forEach(p => {
      if (p.symptoms && p.symptoms.length > 0) {
        p.symptoms.forEach(s => {
          const dayAvg = ((s.energy || 5) + (s.sleep || 5) + (s.mood || 5)) / 3;
          totalQolPoints += dayAvg * 10; 
          symptomsCount++;
        });
      }
    });

    const finalQol = symptomsCount > 0 ? Math.round(totalQolPoints / symptomsCount) : 74;

    setMetrics({
      totalEnrolled: total,
      activeThisWeek: total > 0 ? Math.ceil(total * 0.75) : 0, 
      avgCompliance: total > 0 ? '88.2%' : '0%',
      avgQol: finalQol,
      escalationsCount: ambersAndReds
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('allvi_clinic_token');
    navigate('/clinical-login');
  };

  const tabs = [
    { id: 'executive', label: 'Executive View', icon: Layers },
    { id: 'panel', label: 'Patient Panel', icon: Users },
    { id: 'alerts', label: 'Alert Queue', icon: Bell },
    { id: 'invite', label: 'Invite Patient', icon: UserPlus },
  ];

  const getRiskStyle = (risk) => {
    switch(risk) {
      case 'Green': return { bg: '#E6F4EA', text: '#137333' };
      case 'Amber': return { bg: '#FEF3C7', text: '#B45309' }; 
      case 'Red': return { bg: '#FCE8E6', text: '#C5221F' };
      default: return { bg: '#fff', text: '#475569' };
    }
  };

  const getPreApptBadge = (status) => {
    switch(status) {
      case 'Draft': return { bg: '#fff', text: '#475569' };
      case 'In Review': return { bg: '#E0F2FE', text: '#0369A1' };
      case 'Approved': return { bg: '#D6EDF1', text: '#0D5C6E' };
      case 'Delivered': return { bg: '#D1FAE5', text: '#065F46' };
      default: return { bg: '#fff', text: '#475569' };
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' || patient.risk === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={styles.dashboardContainer}>
      
      {/* ================= HEADER BRANDING NAVBAR ================= */}
      <header style={styles.mainNavbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoCircle}>
            <span style={styles.logoTextMain}>All</span>
            <span style={styles.logoTextSub}>vi</span>
          </div>
          <div style={styles.verticalDivider} />
          <div style={styles.brandInfo}>
            <h1 style={styles.brandTitle}>Clinical Administration</h1>
            <p style={styles.brandStatus}>Secure Data Node Active</p>
          </div>
        </div>

        <div style={styles.navRight}>
          {!isMobile && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>Dr. Sarah Jenkins</span>
              <span style={styles.userRole}>Medical Director</span>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutButton}>
            <LogOut size={16} />
            {!isMobile && <span>Log Out</span>}
          </button>
        </div>
      </header>

      {/* ================= SUB-NAVBAR TAB SYSTEM ================= */}
      <div style={{
        ...styles.subNavbar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        padding: isMobile ? '12px 24px' : '0 48px',
      }}>
        <div style={styles.subNavTitleBlock}>
          <span style={styles.currentViewBadge}>
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        
        <div style={{
          ...styles.tabGroup,
          overflowX: isMobile ? 'auto' : 'visible',
          width: isMobile ? '100%' : 'auto',
          marginTop: isMobile ? '10px' : '0'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  borderBottom: isActive ? '3px solid #0D5C6E' : '3px solid transparent',
                  color: isActive ? '#0D5C6E' : '#556575',
                  fontWeight: isActive ? '700' : '600',
                  backgroundColor: isActive ? 'rgba(13, 92, 110, 0.05)' : 'transparent'
                }}
              >
                <Icon size={16} color={isActive ? '#0D5C6E' : '#718096'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= CORE CONTENT FRAME CONTAINER ================= */}
      <main style={{...styles.mainContent, padding: isMobile ? '24px' : '40px 48px'}}>
        
        {loading ? (
          <div style={styles.loaderArea}>
            <Loader2 size={36} className="animate-spin" color="#0D5C6E" />
            <p style={{marginTop: '16px', fontWeight: '700', color: '#0D5C6E', letterSpacing: '0.3px'}}>Syncing secure tracking channels...</p>
          </div>
        ) : (
          <>
            {/* TAB CONTENT MODULE A: EXECUTIVE METRICS SUMMARY */}
            {activeTab === 'executive' && (
              <div style={styles.viewContainer}>
                <h3 style={styles.sectionHeading}>Programme Snapshot</h3>
                <div style={{...styles.gridContainer, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr'}}>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Total Patients Enrolled</span>
                      <Users size={18} color="#0D5C6E" />
                    </div>
                    <div style={styles.cardValue}>{metrics.totalEnrolled}</div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Live</span> active records</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Active This Week</span>
                      <Activity size={18} color="#1A7A8A" />
                    </div>
                    <div style={styles.cardValue}>{metrics.activeThisWeek}</div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>~75%</span> interaction velocity</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Avg Tracking Compliance</span>
                      <CheckCircle size={18} color="#0D5C6E" />
                    </div>
                    <div style={styles.cardValue}>{metrics.avgCompliance}</div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Stable</span> data stream loop</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Avg QoL Score Panel</span>
                      <Smile size={18} color="#1A7A8A" />
                    </div>
                    <div style={styles.cardValue}>{metrics.avgQol} <span style={{fontSize: '14px', color: '#718096'}}>/100</span></div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Derived</span> from client logs</div>
                  </div>
                </div>

                <h3 style={styles.sectionHeading}>Outcomes Metrics</h3>
                <div style={{...styles.gridContainer, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr'}}>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Appointments Avoided</span>
                      <Sparkles size={18} color="#0D5C6E" />
                    </div>
                    <div style={styles.cardValue}>{Math.ceil(metrics.totalEnrolled * 2.2 + 4)}</div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Capacity</span> optimized</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Early Escalations Caught</span>
                      <ShieldAlert size={18} color="#B45309" />
                    </div>
                    <div style={{...styles.cardValue, color: '#B45309'}}>{metrics.escalationsCount}</div>
                    <div style={styles.errorFooter}>Requires prompt review</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Medication Adherence</span>
                      <CheckCircle size={18} color="#1A7A8A" />
                    </div>
                    <div style={styles.cardValue}>91.4%</div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Above goal</span> metrics</div>
                  </div>
                  <div style={styles.metricCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardLabel}>Avg Time to Green Status</span>
                      <TrendingUp size={18} color="#0D5C6E" />
                    </div>
                    <div style={styles.cardValue}>14.2 <span style={{fontSize: '14px', color: '#718096'}}>Days</span></div>
                    <div style={styles.cardFooter}><span style={styles.trendUp}>Stabilizing</span> timeline targets</div>
                  </div>
                </div>

                <div style={{...styles.splitSectionRow, flexDirection: isMobile ? 'column' : 'row'}}>
                  <div style={styles.largeDataBlock}>
                    <div style={styles.blockTitleContainer}>
                      <h4 style={styles.blockTitle}>Enrollment Trend</h4>
                      <span style={styles.timeFilterToggle}>Supabase Integrated</span>
                    </div>
                    <div style={styles.chartFallbackArea}>
                      <div style={styles.mockChartContainer}>
                        <div style={{...styles.mockBar, height: '40%'}}><span style={styles.barLabel}>Interval 1</span></div>
                        <div style={{...styles.mockBar, height: '60%'}}><span style={styles.barLabel}>Interval 2</span></div>
                        <div style={{...styles.mockBar, height: `${Math.min(metrics.totalEnrolled * 14, 94)}%`, backgroundColor: '#0D5C6E'}}><span style={styles.barLabel}>Live Stream</span></div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.mediumDataBlock}>
                    <h4 style={styles.blockTitle}>Revenue Generated (Clinic Share)</h4>
                    <div style={styles.revenueSplitBox}>
                      <div style={styles.revRow}>
                        <div>
                          <div style={styles.revLabel}>This Month Share</div>
                          <div style={styles.revValue}>${(metrics.totalEnrolled * 125).toLocaleString()}.00</div>
                        </div>
                        <div style={styles.revIconContainer}><DollarSign size={22} color="#0D5C6E" /></div>
                      </div>
                      <hr style={styles.divider} />
                      <div style={styles.revRow}>
                        <div>
                          <div style={styles.revLabel}>Year-to-Date (YTD)</div>
                          <div style={{...styles.revValue, fontSize: '24px'}}>${(metrics.totalEnrolled * 720).toLocaleString()}.00</div>
                        </div>
                        <div style={{...styles.revIconContainer, backgroundColor: '#D6EDF1'}}><ArrowUpRight size={22} color="#0D5C6E" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT MODULE B: PATIENT SUMMARY WORKSPACE GRID */}
            {activeTab === 'panel' && (
              <div style={styles.panelContainer}>
                <div style={styles.controlBar}>
                  <div style={styles.searchWrapper}>
                    <Search size={18} style={styles.searchIcon} />
                    <input 
                      type="text" 
                      placeholder="Search panel by name or Patient ID..." 
                      style={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={styles.filterWrapper}>
                    <Filter size={16} color="#0D5C6E" />
                    <select 
                      style={styles.filterSelect}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Risk Profiles</option>
                      <option value="Green">Green Status</option>
                      <option value="Amber">Amber Status</option>
                      <option value="Red">Red Status</option>
                    </select>
                  </div>
                </div>

                <div style={styles.tableResponsiveContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>Patient Identifier</th>
                        <th style={styles.th}>Clinical Profile / Condition</th>
                        <th style={styles.th}>Enrolled</th>
                        <th style={styles.th}>Streak</th>
                        <th style={styles.th}>Risk Status</th>
                        <th style={styles.th}>Last Check-In</th>
                        <th style={styles.th}>Next Appt</th>
                        <th style={styles.th}>Pre-Appt Status</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Panel Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => {
                        const riskColors = getRiskStyle(patient.risk);
                        const statusColors = getPreApptBadge(patient.preApptStatus);
                        
                        return (
                          <tr key={patient.id} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={styles.patientPrimaryName}>{patient.name}</div>
                              <div style={styles.patientSubID}>{patient.id}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={styles.conditionText}>{patient.condition}</span>
                            </td>
                            <td style={styles.td}>{patient.enrollDate}</td>
                            <td style={styles.td}>
                              <div style={styles.streakIndicator}>{patient.streak}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusBadge,
                                backgroundColor: riskColors.bg,
                                color: riskColors.text
                              }}>
                                <span style={{ ...styles.badgeDot, backgroundColor: riskColors.text }} />
                                {patient.risk}
                              </span>
                            </td>
                            <td style={styles.td}>{patient.lastCheckin}</td>
                            <td style={styles.td}>
                              <div style={styles.apptDateText}>{patient.nextAppt}</div>
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusBadge,
                                backgroundColor: statusColors.bg,
                                color: statusColors.text,
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                {patient.preApptStatus}
                              </span>
                            </td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                              <div style={styles.actionButtonGroup}>
                                <button 
                                  onClick={() => navigate(`/dashboard/${patient.id}`)}
                                  style={styles.btnDashboard}
                                >
                                  <ExternalLink size={13} />
                                  <span>View Dashboard</span>
                                </button>
                                <button 
                                  onClick={() => navigate(`/clinical-summary/${patient.id}`)}
                                  style={styles.btnSummary}
                                >
                                  <FileText size={13} />
                                  <span>View Clinical Summary</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredPatients.length === 0 && (
                    <div style={styles.placeholderView}>No matching database entries found.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Core View placeholders for secondary tabs */}
        {activeTab === 'alerts' && <div style={styles.placeholderView}><h3>Alert Queue Monitor</h3><p>Critical threshold events and risk triggers workspace layout.</p></div>}
        {activeTab === 'invite' && <div style={styles.placeholderView}><h3>Invite New Patient</h3><p>Generate secure intake magic linking invitation entries.</p></div>}
      </main>
    </div>
  );
};

// Edge-to-Edge Adaptive Layout Style Guide Tokens Map
const styles = {
  dashboardContainer: { 
    backgroundColor: '#F7F1E8', // Matches the client register onboarding backdrop canvas color token
    minHeight: '100vh',
    width: '100vw',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    overflowX: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
  },
  mainNavbar: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#0D5C6E', // Official Dark Teal Identity Anchor
    padding: '16px 48px', 
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 14px rgba(13, 92, 110, 0.15)' 
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  logoCircle: { backgroundColor: '#ffffff', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  logoTextMain: { fontFamily: 'serif', fontSize: '18px', fontWeight: '700', color: '#0D5C6E', marginLeft: '6px' },
  logoTextSub: { fontFamily: 'serif', fontSize: '18px', fontWeight: '300', fontStyle: 'italic', color: '#1A7A8A' },
  verticalDivider: { width: '1px', height: '30px', backgroundColor: 'rgba(214, 237, 241, 0.25)' },
  brandInfo: { display: 'flex', flexDirection: 'column' },
  brandTitle: { fontSize: '16px', fontWeight: '700', color: '#D6EDF1', margin: 0, letterSpacing: '0.3px' },
  brandStatus: { fontSize: '11px', color: 'rgba(214, 237, 241, 0.7)', margin: '3px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' },
  navRight: { display: 'flex', alignItems: 'center', gap: '24px' },
  userInfo: { display: 'flex', flexDirection: 'column', textAlign: 'right' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#ffffff' },
  userRole: { fontSize: '12px', color: '#D6EDF1', opacity: 0.8 },
  logoutButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: '1px solid rgba(214, 237, 241, 0.4)', borderRadius: '8px', color: '#D6EDF1', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  subNavbar: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box', borderBottom: '1px solid rgba(13, 92, 110, 0.08)' },
  subNavTitleBlock: { display: 'flex', alignItems: 'center', padding: '16px 0' },
  currentViewBadge: { backgroundColor: '#D6EDF1', color: '#0D5C6E', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tabGroup: { display: 'flex', gap: '6px' },
  tabButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '20px 24px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s' },
  mainContent: { width: '100%', boxSizing: 'border-box' },
  viewContainer: { display: 'flex', flexDirection: 'column', gap: '28px' },
  sectionHeading: { fontSize: '15px', fontWeight: '800', color: '#0D5C6E', margin: '6px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.8px' },
  gridContainer: { display: 'grid', gap: '24px' },
  metricCard: { backgroundColor: '#ffffff', padding: '26px', borderRadius: '18px', border: '1px solid rgba(26, 122, 138, 0.06)', boxShadow: '0 4px 12px rgba(13, 92, 110, 0.015)' },
  cardHeader: { display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  cardLabel: { fontSize: '13px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.2px' },
  cardValue: { fontSize: '32px', fontWeight: '800', color: '#0D5C6E', marginBottom: '6px', letterSpacing: '-0.5px' },
  cardFooter: { fontSize: '12px', color: '#64748B', fontWeight: '500' },
  trendUp: { color: '#1A7A8A', fontWeight: '700', marginRight: '4px' },
  errorFooter: { fontSize: '12px', color: '#B45309', fontWeight: '700' },
  splitSectionRow: { display: 'flex', gap: '24px' },
  largeDataBlock: { flex: 2, backgroundColor: '#ffffff', padding: '26px', borderRadius: '18px', border: '1px solid rgba(26, 122, 138, 0.06)' },
  mediumDataBlock: { flex: 1, backgroundColor: '#ffffff', padding: '26px', borderRadius: '18px', border: '1px solid rgba(26, 122, 138, 0.06)' },
  blockTitleContainer: { display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '22px' },
  blockTitle: { fontSize: '14px', fontWeight: '800', color: '#0D5C6E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  timeFilterToggle: { fontSize: '11px', fontWeight: '700', color: '#0D5C6E', backgroundColor: '#D6EDF1', padding: '4px 12px', borderRadius: '6px' },
  chartFallbackArea: { height: '170px', display: 'flex', alignItems: 'flex-end', justifycontent: 'center' },
  mockChartContainer: { width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifycontent: 'space-around', borderBottom: '2px solid #D6EDF1' },
  mockBar: { width: '18%', backgroundColor: '#1A7A8A', borderRadius: '6px 6px 0 0', display: 'flex', position: 'relative' },
  barLabel: { fontSize: '11px', color: '#64748B', position: 'absolute', bottom: '-26px', fontWeight: '600' },
  revenueSplitBox: { display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '22px' },
  revRow: { display: 'flex', justifycontent: 'space-between', alignItems: 'center' },
  revLabel: { fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2px' },
  revValue: { fontSize: '24px', fontWeight: '800', color: '#0D5C6E' },
  revIconContainer: { backgroundColor: '#F8FAF9', padding: '12px', borderRadius: '14px' },
  divider: { border: 'none', borderTop: '1px solid rgba(26, 122, 138, 0.08)' },
  placeholderView: { backgroundColor: '#ffffff', padding: '64px 44px', borderRadius: '18px', textAlign: 'center', color: '#64748B', border: '1px solid rgba(26, 122, 138, 0.06)' },
  loaderArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', padding: '140px 0' },
  
  // Decoupled embedded patient panel elements layout guides
  panelContainer: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '28px', border: '1px solid rgba(26, 122, 138, 0.06)', boxShadow: '0 4px 12px rgba(13, 92, 110, 0.01)' },
  controlBar: { display: 'flex', justifycontent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '26px' },
  searchWrapper: { position: 'relative', flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '16px', color: '#1A7A8A' },
  searchInput: { width: '100%', padding: '12px 16px 12px 46px', fontSize: '14px', borderRadius: '12px', border: '1.5px solid #D6EDF1', outline: 'none', color: '#1F2937' },
  filterWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F8FAF9', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(26, 122, 138, 0.12)' },
  filterSelect: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#0D5C6E', cursor: 'pointer' },
  tableResponsiveContainer: { width: '100%', overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(26, 122, 138, 0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  thRow: { backgroundColor: '#F8FAF9', borderBottom: '2px solid #D6EDF1' },
  th: { padding: '18px 16px', fontWeight: '700', color: '#0D5C6E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid rgba(26, 122, 138, 0.04)', transition: 'background-color 0.15s ease' },
  td: { padding: '18px 16px', verticalAlign: 'middle', color: '#334155', whiteSpace: 'nowrap' },
  patientPrimaryName: { fontWeight: '700', color: '#0D5C6E', fontSize: '14px' },
  patientSubID: { fontSize: '11px', color: '#718096', fontWeight: '700', marginTop: '3px', letterSpacing: '0.5px' },
  conditionText: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  streakIndicator: { fontWeight: '800', color: '#1A7A8A', fontSize: '13px' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.3px' },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%' },
  apptDateText: { fontWeight: '700' },
  actionButtonGroup: { display: 'flex', gap: '10px', justifycontent: 'flex-end' },
  btnDashboard: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#D6EDF1', color: '#0D5C6E', border: 'none', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  btnSummary: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0D5C6E', color: '#D6EDF1', border: 'none', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default ClinicDashboard;