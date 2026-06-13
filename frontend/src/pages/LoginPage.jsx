/**
 * @file        LoginPage.jsx
 * @module      pages
 * @description Page component managing user sign-in, registration, and quick testing shortcuts.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Lock, Mail, User, AlertCircle, Sparkles } from 'lucide-react';

/**
 * @function  LoginPage
 * @summary   Renders the login and registration portals, handling form validations and session updates
 * @returns   {React.ReactElement} LoginPage layout template
 */
function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (auth?.isAuthenticated) {
      if (auth.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/menu');
      }
    }
  }, [auth, navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!auth) return;

    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const data = await authService.login(email, password);
        auth.login(data.user, data.token);
        
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/menu');
        }
      } else {
        const data = await authService.register(name, email, password);
        auth.login(data.user, data.token);
        navigate('/menu');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    if (!auth) return;
    setError(null);
    setLoading(true);

    const targetEmail = role === 'admin' ? 'ravi.sharma@pizzajoint.com' : 'rajesh.kumar@gmail.com';
    const targetPassword = role === 'admin' ? 'Admin@1234' : 'Customer@1234';

    try {
      const data = await authService.login(targetEmail, targetPassword);
      auth.login(data.user, data.token);
      
      if (data.user.role === 'admin' || data.user.role === 'manager') {
        navigate('/admin');
      } else {
        navigate('/menu');
      }
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="glass-card p-8 space-y-6">
        {/* Tab Selection */}
        <div className="flex border-b border-white/5 pb-4">
          <button
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'login' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-light/60 hover:text-brand-light'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`flex-1 text-center pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'register' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-light/60 hover:text-brand-light'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-brand-legend/10 border border-brand-legend/25 text-brand-legend text-xs leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div className="space-y-1">
              <label htmlFor="name-field" className="label-text">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                  <User size={16} />
                </span>
                <input
                  id="name-field"
                  type="text"
                  required
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email-field" className="label-text">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                <Mail size={16} />
              </span>
              <input
                id="email-field"
                type="email"
                required
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password-field" className="label-text">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                <Lock size={16} />
              </span>
              <input
                id="password-field"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-bold mt-4"
          >
            {loading ? 'Authenticating...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Developer Shortcut Panel */}
        <div className="border-t border-white/5 pt-6 mt-6 space-y-4">
          <div className="flex items-center space-x-1.5 text-brand-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Developer Shortcuts</span>
          </div>
          <p className="text-[10px] text-brand-light/50 leading-relaxed text-left">
            Instant profile simulation: Click below to bypass credentials and check page configurations instantly.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin('customer')}
              disabled={loading}
              className="px-3 py-2 text-[10px] font-bold rounded-xl bg-white/5 border border-white/10 text-brand-light hover:bg-white/10 transition-all text-center"
            >
              Customer Profile
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="px-3 py-2 text-[10px] font-bold rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all text-center"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
