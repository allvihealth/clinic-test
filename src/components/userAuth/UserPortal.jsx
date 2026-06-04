import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import UserLogin from './UserLogin';
import ForgotPassword from './ForgotPassword';
import UserActivate from './UserActivate';

const UserPortal = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 🔗 PATH ROUTING SYNC: Sets default view state depending on browser URL paths
    const [view, setView] = useState(location.pathname === '/login' ? 'login' : 'signup');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Shared Palette Theme Design Styles
    const styles = {
        ivory: '#F7F1E8',
        teal: '#0F4C5C',
        charcoal: '#1F2937',
        grey: '#6B7280',
        white: '#FFFFFF',
        green: '#059669',
        greenBg: 'rgba(5, 150, 105, 0.08)'
    };

    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [activationEmail, setActivationEmail] = useState('');
    const [activationPassword, setActivationPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Sync views dynamically if back buttons or popstates are triggered
    useEffect(() => {
        if (location.pathname === '/login') {
            setView('login');
        } else if (location.pathname === '/activate') {
            setView('signup');
        }
    }, [location.pathname]);

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
                allviId: loginIdentifier.trim(),
                password: loginPassword
            });

            if (response.data.success) {
                const { session, patient } = response.data;
                const profile = patient;
                localStorage.setItem('allvi_id', profile.id);
                localStorage.setItem('user_profile', JSON.stringify(profile));
                localStorage.setItem('allvi_auth_token', session.access_token);
                navigate(`/dashboard/${profile.id}`);
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
                const { session, patient } = response.data;
                const generatedId = patient.id;
                localStorage.setItem('allvi_id', generatedId);
                localStorage.setItem('user_profile', JSON.stringify(response.data.patient));
                localStorage.setItem('prefill_email', activationEmail.toLowerCase().trim());
                localStorage.setItem('allvi_auth_token', session.access_token);
                navigate(`/onboarding/${generatedId}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Activation request rejected. Contact portal system support.");
        } finally {
            setLoading(false);
        }
    };

    // Clean path modifications when user triggers toggle buttons
    const handleSwitchToLogin = () => {
        setError('');
        setView('login');
        navigate('/login');
    };

    const handleSwitchToActivate = () => {
        setError('');
        setView('signup');
        navigate('/activate');
    };

    return (
        <>
            {view === 'login' ? (
                <UserLogin
                    styles={styles}
                    loginIdentifier={loginIdentifier}
                    setLoginIdentifier={setLoginIdentifier}
                    loginPassword={loginPassword}
                    setLoginPassword={setLoginPassword}
                    loading={loading}
                    error={error}
                    onSubmit={handleAccess}
                    onSwitchView={handleSwitchToActivate}
                    // Pass the new prop here to toggle to forgot password view
                    onForgotPassword={() => setView('forgot')}
                />
            ) : view === 'signup' ? (
                <UserActivate
                    styles={styles}
                    activationEmail={activationEmail}
                    setActivationEmail={setActivationEmail}
                    activationPassword={activationPassword}
                    setActivationPassword={setActivationPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    loading={loading}
                    error={error}
                    onSubmit={handleActivationSubmit}
                    onSwitchView={handleSwitchToLogin}
                />
            ) : (
                // This is the new 'forgot' view
                <ForgotPassword
                    onBack={() => setView('login')}
                    getBaseURL={getBaseURL}
                />
            )}
        </>
    );
};

export default UserPortal;