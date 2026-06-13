/**
 * @file        StaffLoginPage.jsx
 * @module      pages
 * @description Page component managing internal staff authentication with distinct amber aesthetics.
 * @author      Antigravity
 * @version     1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffLogin } from '../services/authService';
import { Lock, Mail, AlertCircle, ShieldAlert } from 'lucide-react';

function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { staffAuth, loginStaff } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
      case 'manager':
        return '/admin';
      case 'server':
      case 'cashier':
        return '/staff/orders';
      case 'delivery_driver':
      case 'driver':
        return '/staff/deliveries';
      case 'chef':
      case 'cook':
        return '/staff/kitchen';
      default:
        return '/';
    }
  };

  useEffect(() => {
    // Redirect if already logged in as staff
    if (staffAuth.isLoggedIn) {
      navigate(getRedirectPath(staffAuth.role));
    }
  }, [staffAuth.isLoggedIn, staffAuth.role, navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await staffLogin(email, password);
      if (res.success) {
        loginStaff(res.data.user, res.data.token);
        const path = getRedirectPath(res.data.user.role);
        navigate(path);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify staff credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="border border-amber-500/20 bg-brand-darker/60 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl shadow-amber-950/20">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-amber-500/10 rounded-2xl text-amber-500 mb-2">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-amber-500">Staff Login — Pizza Joint</h2>
          <p className="text-xs text-brand-light/60">Log in to manage operations, deliveries, kitchen, and administration.</p>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="staff-email-field" className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Staff Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-500/30">
                <Mail size={16} />
              </span>
              <input
                id="staff-email-field"
                type="email"
                required
                placeholder="Enter staff email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl py-2 pl-10 pr-3 text-xs focus:outline-none text-brand-light transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="staff-password-field" className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-500/30">
                <Lock size={16} />
              </span>
              <input
                id="staff-password-field"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl py-2 pl-10 pr-3 text-xs focus:outline-none text-brand-light transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold mt-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg shadow-amber-950/40"
          >
            {loading ? 'Authenticating Staff...' : 'Sign In as Staff'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/login" className="text-[10px] text-brand-light/60 hover:text-brand-light hover:underline uppercase tracking-wider font-semibold">
            Are you a customer? Back to Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StaffLoginPage;
