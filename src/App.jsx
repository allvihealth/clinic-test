import React, { useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Phase1Upload from './components/Phase1Upload';
import Phase1Review from './components/Phase1Review';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal'; 
import PatientProfile from './components/PatientProfile';
import UserPortal from './components/UserPortal';
import RegisterPage from './components/RegisterPage';
import ClinicalSummary from './components/ClinicalSummary';
import IntakeForm from './components/IntakeForm';
import { LogIn } from 'lucide-react';

// Simple wrapper for the Dashboard to extract the ID from URL
const DashboardWrapper = () => {
    const { id } = useParams();
    return <Dashboard patientId={id} />;
};

function App() {
  const navigate = useNavigate();

  // --- OPTIONAL SESSION REDIRECT ---
  // If a user is already "logged in", we still send them to their profile 
  // if they try to visit the login page manually.
  useEffect(() => {
    const savedId = localStorage.getItem('allvi_auth_token');
    const publicPaths = ['/login', '/register'];
    
    if (savedId && publicPaths.includes(window.location.pathname)) {
        navigate(`/profile/${savedId}`);
    }
  }, [navigate]);

  return (
    <div className="app-container" style={{ minHeight: '100vh', backgroundColor: "#F7F1E8" }}>
      
      <Navbar />

      <main style={{ padding: '20px' }}>
        <Routes>
          {/* Public Access to All Routes */}
          <Route path="/" element={<UserPortal />} />
          <Route path="/intake" element={<IntakeForm />} />

          <Route path="/phase1upload" element={<Phase1Upload />} />
          <Route path="/register" element={<RegisterPage />}/>
          <Route path="/login" element={<UserPortal />} />
          
          {/* Protected checks removed: Users can now access these directly */}
          <Route path="/review" element={<Phase1Review />} />
          <Route path="/dashboard/:id" element={<DashboardWrapper />} />
          <Route path="/profile/:patientId" element={<PatientProfile />} />
          <Route path="/clinical-summary/:patientId" element={<ClinicalSummary/>} />
          {/* Admin Route */}
          <Route path="/admin" element={<AdminPortal />} />
          
          {/* 404 Route */}
          <Route path="*" element={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2 style={{ color: '#0F4C5C' }}>404 - Page Not Found</h2>
              <button 
                onClick={() => navigate('/login')} 
                style={{ 
                  marginTop: '20px', 
                  cursor: 'pointer', 
                  color: '#0F4C5C', 
                  fontWeight: 'bold', 
                  background: 'none', 
                  border: '1px solid #0F4C5C', 
                  padding: '10px 20px', 
                  borderRadius: '10px' 
                }}
              >
                Back to Login
              </button>
            </div>
          } />
        </Routes>
      </main>
      
    </div>
  );
}

export default App;