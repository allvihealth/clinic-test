import React, { useEffect } from 'react';
import { AlertCircle, Loader2, Check } from 'lucide-react';

const UserActivate = ({
  styles,
  activationEmail,
  setActivationEmail,
  activationPassword,
  setActivationPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  onSubmit,
  onSwitchView
}) => {
  
  // 🧠 AUTOMATIC PARAMS LINK FILL: Extracts email query string out of URL parameters automatically
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setActivationEmail(decodeURIComponent(emailParam).trim().toLowerCase());
    }
  }, [setActivationEmail]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: styles.ivory, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 600, color: styles.teal }}>Allvi</div>
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: styles.grey, marginTop: '4px' }}>Reimagined Patient Care</div>
      </div>

      <div style={{ backgroundColor: styles.white, borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(15, 76, 92, 0.06)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: styles.greenBg, borderRadius: '20px', padding: '5px 14px', marginBottom: '24px' }}>
          <Check size={12} color={styles.green} strokeWidth={3} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: styles.green }}>Invitation confirmed</span>
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: styles.charcoal, marginBottom: '8px', lineHeight: 1.3 }}>Welcome to Allvi</h2>
        <p style={{ fontSize: '14px', color: styles.grey, marginBottom: '28px', lineHeight: '1.6' }}>
          Set your password to activate your account and start your care program.
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: styles.grey, display: 'block', marginBottom: '6px' }}>Your email</label>
            <input
              type="email"
              placeholder="e.g., name@email.com"
              value={activationEmail}
              onChange={(e) => setActivationEmail(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(15, 76, 92, 0.2)', borderRadius: '8px', fontSize: '14px', color: styles.charcoal, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: styles.grey, display: 'block', marginBottom: '6px' }}>Create a password *</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={activationPassword}
              onChange={(e) => setActivationPassword(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(15, 76, 92, 0.2)', borderRadius: '8px', fontSize: '14px', color: styles.charcoal, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: styles.grey, display: 'block', marginBottom: '6px' }}>Confirm password *</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid rgba(15, 76, 92, 0.2)', borderRadius: '8px', fontSize: '14px', color: styles.charcoal, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontSize: '13px', backgroundColor: 'rgba(220, 38, 38, 0.05)', padding: '10px 12px', borderRadius: '8px', marginBottom: '20px' }}>
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#0d3b47] transition-all shadow-lg disabled:opacity-70 mb-4"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Activate Account →</>}
          </button>
          
          <button
            type="button"
            onClick={onSwitchView}
            disabled={loading}
            style={{ width: '100%', background: 'transparent', border: 'none', color: styles.charcoal, fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Already activated? Login →
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: styles.grey, marginTop: '20px', lineHeight: '1.5' }}>
            By activating you agree to Allvi's <span style={{ color: styles.teal, cursor: 'pointer' }}>Privacy Policy</span> and <span style={{ color: styles.teal, cursor: 'pointer' }}>Terms of Service</span>.
          </p>
        </form>
      </div>
      <div style={{ marginTop: '24px', fontSize: '12px', color: styles.grey }}>🔒 GDPR-compliant · 🔒 HIPAA-compliant · Encrypted · Secure</div>
    </div>
  );
};

export default UserActivate;