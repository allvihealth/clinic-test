import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = ({ onBack, getBaseURL }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState('verify'); // 'verify', 'reset', 'success'
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleVerify = async () => {
        if (!identifier) return;
        setLoading(true);
        try {
            const res = await axios.post(`${getBaseURL()}/api/patient/verify`, { identifier });
            if (res.data.success) {
                setUserId(res.data.userId);
                setStep('reset');
                setMessage(null);
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Account not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${getBaseURL()}/api/patient/update-password`, { userId, newPassword: password });
            setStep('success');
            setMessage("Password updated successfully!");
        } catch (err) {
            setMessage("Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F1E8] flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200">
                <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight mb-2">
                    {step === 'success' ? 'All set!' : 'Reset Password'}
                </h2>
                <p className="text-sm text-slate-500 mb-8">
                    {step === 'verify' ? "Enter your ALLVI ID or Email to verify your account." : 
                     step === 'reset' ? "Create a new, secure password for your portal." : 
                     "Your password has been changed successfully."}
                </p>

                {step === 'verify' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-12 pr-4 py-4 bg-[#F7F1E8]/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                                placeholder="ALLVI ID or Email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleVerify} 
                            className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0d3b47] transition-all cursor-pointer"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Verify Identity"}
                        </button>
                    </div>
                )}

                {step === 'reset' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-12 pr-12 py-4 bg-[#F7F1E8]/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                                placeholder="Enter New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                            />
                            <button 
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F4C5C] cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button 
                            onClick={handleUpdate} 
                            className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0d3b47] transition-all cursor-pointer"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Update Password"}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-6">
                        <CheckCircle2 className="mx-auto text-emerald-600 mb-4" size={48} />
                        <button 
                            onClick={onBack} 
                            className="w-full bg-[#0F4C5C] text-white py-4 rounded-2xl font-black text-xs uppercase cursor-pointer"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {message && step !== 'success' && (
                    <p className={`mt-4 text-xs font-bold text-center text-red-500 }`}>
                        {message}
                    </p>
                )}
                
                {step !== 'success' && (
                    <button 
                        onClick={onBack} 
                        className="mt-6 w-full text-xs text-slate-400 underline flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft size={12} /> Back to Login
                    </button>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;