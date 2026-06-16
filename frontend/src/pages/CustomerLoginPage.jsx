/**
 * @file        CustomerLoginPage.jsx
 * @module      pages
 * @description Page component managing customer authentication and registration.
 * @author      Antigravity
 * @version     1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerLogin, register } from '../services/authService';
import { Lock, Mail, User, AlertCircle } from 'lucide-react';

function CustomerLoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { customerAuth, loginCustomer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in as customer
    if (customerAuth.isLoggedIn || isAuthenticated) {
      navigate('/account');
    }
  }, [customerAuth.isLoggedIn, isAuthenticated, navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await customerLogin(email, password);
        if (res.user && res.token) {
          loginCustomer(res.user, res.token);
          navigate('/account');
        }
      } else {
        const res = await register(name, email, password);
        if (res.user) {
          loginCustomer(res.user, res.token);
          navigate('/account');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="glass-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-brand-light">Customer Portal</h2>
          <p className="text-xs text-brand-light/60">Log in to view rewards, order history, and account settings.</p>
        </div>

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
              <label htmlFor="customer-name-field" className="label-text">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                  <User size={16} />
                </span>
                <input
                  id="customer-name-field"
                  type="text"
                  required
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-xs w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary text-brand-light"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="customer-email-field" className="label-text">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                <Mail size={16} />
              </span>
              <input
                id="customer-email-field"
                type="email"
                required
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10 text-xs w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary text-brand-light"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="customer-password-field" className="label-text">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                <Lock size={16} />
              </span>
              <input
                id="customer-password-field"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 text-xs w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary text-brand-light"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold mt-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl transition-all"
          >
            {loading ? 'Authenticating...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/staff/login" className="text-[10px] text-brand-primary hover:underline uppercase tracking-wider font-semibold">
            Are you a staff member? Access Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerLoginPage;
