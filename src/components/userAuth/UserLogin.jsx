import React from 'react';
import { User, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const UserLogin = ({ 
  loginIdentifier, 
  setLoginIdentifier, 
  loginPassword, 
  setLoginPassword, 
  loading, 
  error, 
  onSubmit, 
  onSwitchView,
   styles
}) => {
  return (
    <div className="min-h-screen bg-[#F7F1E8] flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-10 md:p-12">
          <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight mb-2">Welcome to Allvi</h2>
          <p className="text-sm text-slate-500 mb-8">Access your records using either your email address or ALLVI ID string.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Enter ALLVI ID or Email address"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F7F1E8]/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0F4C5C] outline-none transition-all"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Enter your account password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#F7F1E8]/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#0F4C5C] outline-none transition-all"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0d3b47] transition-all shadow-lg disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Login <ArrowRight size={16} /></>}
            </button>
             <div style={{ textAlign: 'right'}}>
              <span style={{
                fontSize: '13px',
                color: '#0F4C5C', // --teal
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                Forgot password?
              </span>
            </div>

            <div className=" text-center border-t border-slate-100 mt-6">
              <p className="text-xs text-slate-400 mb-1">Pending clinic system enrollment activation?</p>
              <button
                type="button"
                onClick={onSwitchView}
                className="text-[#0F4C5C] hover:text-[#0d3b47] text-sm font-semibold cursor-pointer underline transition-colors"
              >
                Activate Invitation / Signup →
              </button>
            </div>
          </form>
         
        </div>
       
      </div>
      <div style={{ marginTop: '24px', fontSize: '12px', color: styles.grey, textAlign:"center" }}>🔒 GDPR-compliant · 🔒 HIPAA-compliant · Encrypted · Secure</div>
    </div>
  );
};

export default UserLogin;