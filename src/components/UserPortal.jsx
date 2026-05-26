import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Check, User } from 'lucide-react';
import axios from 'axios';

const UserPortal = () => {
    const [view, setView] = useState('login'); 

    // Generalized combined single login state hook parameter
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Onboarding Account Activation Form state fields
    const [activationEmail, setActivationEmail] = useState('');
    const [activationPassword, setActivationPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const styles = {
        ivory: '#F7F1E8',
        teal: '#0F4C5C',
        charcoal: '#1F2937',
        grey: '#6B7280',
        white: '#FFFFFF',
        green: '#059669',
        greenBg: 'rgba(5, 150, 105, 0.08)'
    };

    const getBaseURL = () => {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:5000'
            : import.meta.env.VITE_SERVER_URL || '';
    };

    const handleAccess = async (e) => {
        e.preventDefault();
        setError('');
        if (!loginIdentifier.trim() || !loginPassword) return;

        setLoading(true);
        try {
            const response = await axios.post(`${getBaseURL()}/api/patient/login`, {
                allviId: loginIdentifier.trim(), // Server maps this interchangeably now
                password: loginPassword
            });

            if (response.data.success) {
                const profile = response.data.patient;
                localStorage.setItem('allvi_id', profile.allvi_id);
                localStorage.setItem('user_profile', JSON.stringify(profile));
                navigate(`/dashboard/${profile.allvi_id}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Try running invitation activation first.");
        } finally {
            setLoading(false);
        }
    };

    const handleActivationSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (activationPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (activationPassword !== confirmPassword) {
            setError('Passwords do not match. Please verify parameters.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${getBaseURL()}/api/patient/activate`, {
                email: activationEmail.toLowerCase().trim(),
                password: activationPassword
            });

            if (response.data.success) {
                const generatedId = response.data.allviId;
                localStorage.setItem('allvi_id', generatedId);
                localStorage.setItem('user_profile', JSON.stringify(response.data.patient));
                localStorage.setItem('prefill_email', activationEmail.toLowerCase().trim());

                // Immediately navigate into the intake data capture flow sequence path
                navigate('/onboarding');
            }
        } catch (err) {
            setError(err.response?.data?.message || "Activation request rejected. Contact portal system support.");
        } finally {
            setLoading(false);
        }
    };

    if (view === 'login') {
        return (
            <div className="min-h-screen bg-[#F7F1E8] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
                    <div className="p-10 md:p-12">
                        <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight mb-2">Welcome to Allvi</h2>
                        <p className="text-sm text-slate-500 mb-8">Access your records using either your email address or ALLVI ID string.</p>

                        <form onSubmit={handleAccess} className="space-y-4">
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

                            <div className="pt-4 text-center border-t border-slate-100 mt-6">
                                <p className="text-xs text-slate-400 mb-1">Pending clinic system enrollment activation?</p>
                                <button
                                    type="button"
                                    onClick={() => { setError(''); setView('signup'); }}
                                    className="text-[#0F4C5C] hover:text-[#0d3b47] text-sm font-semibold cursor-pointer underline transition-colors"
                                >
                                    Activate Invitation / Signup →
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: styles.ivory, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 600, color: styles.teal }}>Allvi</div>
                <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: styles.grey, marginTop: '4px' }}>Reimagined Patient Care</div>
            </div>

            <div style={{ backgroundColor: styles.white, borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(15, 76, 92, 0.06)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: styles.greenBg, borderRadius: '20px', padding: '5px 14px', marginBottom: '24px' }}>
                    <Check size={12} color={styles.green} strokeWidth={3} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: styles.green }}>Invitation Setup Mode</span>
                </div>

                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 600, color: styles.charcoal, marginBottom: '8px', lineHeight: 1.3 }}>Welcome to Allvi</h2>
                <p style={{ fontSize: '14px', color: styles.grey, marginBottom: '28px', lineHeight: 1.6 }}>Provide your enrollment details to set up your password securely and unlock the multi-step intake process.</p>

                <form onSubmit={handleActivationSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: styles.grey, display: 'block', marginBottom: '6px' }}>Your Enrolled Email Address *</label>
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
                        className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#0d3b47] transition-all shadow-lg disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Signup →</>}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setError(''); setView('login'); }}
                        disabled={loading}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: styles.charcoal, fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Already activated? Login →
                    </button>
                </form>
            </div>
            <div style={{ marginTop: '24px', fontSize: '12px', color: styles.grey }}>🔒Allvi Encrypted · Secure</div>
        </div>
    );
};

export default UserPortal;