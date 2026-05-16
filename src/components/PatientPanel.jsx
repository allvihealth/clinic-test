import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Path configured properly to your setup

const PatientPanel = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      setLoading(true);

      // Relational database execution matching your explicit keys schema
      const { data, error } = await supabase
        .from('patients')
        .select(`
          allvi_id,
          name,
          created_at,
          patient_intake ( diagnoses ),
          analysis_summaries ( overall_risk_level ),
          symptoms ( date ),
          lab_results ( test_date )
        `);

      if (error) throw error;

      // Map relational tables arrays safely to structural rows
      const normalized = data.map((p) => {
        const diagnosesList = p.patient_intake?.[0]?.diagnoses || [];
        const conditionText = diagnosesList.length > 0 ? diagnosesList.join(', ') : 'General Evaluation';

        const rawRisk = p.analysis_summaries?.[0]?.overall_risk_level || 'Green';
        const formattedRisk = rawRisk.charAt(0).toUpperCase() + rawRisk.slice(1).toLowerCase();

        const totalLogs = p.symptoms?.length || 0;
        const streakText = totalLogs > 0 ? `${totalLogs} Days` : '0 Days';

        let lastCheckInDate = 'No logs';
        if (totalLogs > 0) {
          const timestamps = p.symptoms.map(s => new Date(s.date).getTime());
          lastCheckInDate = new Date(Math.max(...timestamps)).toISOString().split('T')[0];
        }

        return {
          id: p.allvi_id, // This initializes patient.id explicitly
          name: p.name || 'Anonymous Patient',
          condition: conditionText,
          enrollDate: p.created_at ? p.created_at.split('T')[0] : '2026-01-01',
          streak: streakText,
          risk: formattedRisk,
          lastCheckin: lastCheckInDate,
          nextAppt: p.lab_results?.[0]?.test_date || 'TBD',
          preApptStatus: p.analysis_summaries?.length > 0 ? 'Approved' : 'Draft'
        };
      });

      setPatients(normalized);
    } catch (err) {
      console.error('Supabase panel synchronization crash:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskStyle = (risk) => {
    switch (risk) {
      case 'Green': return { bg: '#E6F4EA', text: '#137333' };
      case 'Amber': return { bg: '#FEF3C7', text: '#B45309' }; // Official Allvi Amber
      case 'Red': return { bg: '#FCE8E6', text: '#C5221F' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const getPreApptBadge = (status) => {
    switch (status) {
      case 'Draft': return { bg: '#E2E8F0', text: '#475569' };
      case 'In Review': return { bg: '#E0F2FE', text: '#0369A1' };
      case 'Approved': return { bg: '#D6EDF1', text: '#0D5C6E' }; // Allvi Light -> Dark Teal
      case 'Delivered': return { bg: '#D1FAE5', text: '#065F46' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'All' || patient.risk === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={styles.loaderArea}>
        <Loader2 size={32} className="animate-spin" color="#0D5C6E" />
        <p style={{ marginTop: '12px', fontWeight: '600', color: '#0D5C6E' }}>Syncing database tables...</p>
      </div>
    );
  }

  return (
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
              <th style={styles.th}>Enrolled Date</th>
              <th style={styles.th}>Tracking Streak</th>
              <th style={styles.th}>Current Risk</th>
              <th style={styles.th}>Last Check-In</th>
              <th style={styles.th}>Next Appt</th>
              <th style={styles.th}>Pre-Appt Summary</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Panel Actions</th>
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
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <div style={styles.actionButtonGroup}>
                      
                      {/* Dynamic Dashboard Viewport Redirect Link */}
                      <button 
                        onClick={() => navigate(`/dashboard/${patient.id}`)} 
                        style={styles.btnDashboard}
                      >
                        <ExternalLink size={13} />
                        <span>View Dashboard</span>
                      </button>

                      {/* Dynamic Clinical Summary Node Parameter Link */}
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
          <div style={styles.placeholderView}>No matching clinical data nodes found.</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  panelContainer: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid rgba(26, 122, 138, 0.08)' },
  controlBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' },
  searchWrapper: { position: 'relative', flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', color: '#1A7A8A' },
  searchInput: { width: '100%', padding: '10px 16px 10px 42px', fontSize: '14px', borderRadius: '10px', border: '1.5px solid #D6EDF1', outline: 'none' },
  filterWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAF9', padding: '4px 14px', borderRadius: '10px', border: '1px solid rgba(26, 122, 138, 0.15)' },
  filterSelect: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#0D5C6E', cursor: 'pointer' },
  tableResponsiveContainer: { width: '100%', overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(26, 122, 138, 0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  thRow: { backgroundColor: '#F8FAF9', borderBottom: '2px solid #D6EDF1' },
  th: { padding: '16px', fontWeight: '700', color: '#0D5C6E', fontSize: '13px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid rgba(26, 122, 138, 0.05)' },
  td: { padding: '16px', verticalAlign: 'middle', color: '#334155', whiteSpace: 'nowrap' },
  patientPrimaryName: { fontWeight: '700', color: '#0D5C6E', fontSize: '14px' },
  patientSubID: { fontSize: '11px', color: '#718096', fontWeight: '600', marginTop: '2px' },
  conditionText: { fontSize: '13px', fontWeight: '500' },
  streakIndicator: { fontWeight: '700', color: '#1A7A8A', fontSize: '13px' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%' },
  apptDateText: { fontWeight: '600' },
  actionButtonGroup: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  btnDashboard: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#D6EDF1', color: '#0D5C6E', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  btnSummary: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#0D5C6E', color: '#D6EDF1', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  placeholderView: { backgroundColor: '#ffffff', padding: '40px', textAlign: 'center', color: '#64748B' },
  loaderArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }
};

export default PatientPanel;