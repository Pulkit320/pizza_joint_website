/**
 * @file        DevLoginSwitcher.jsx
 * @module      components
 * @description Floating developer utility panel for instantly switching between mock accounts in development mode.
 * @author      Antigravity
 * @version     1.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerLogin, staffLogin } from '../services/authService';
import { Sparkles, Terminal, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';

function DevLoginSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { loginCustomer, loginStaff, logoutCustomer, logoutStaff, customerAuth, staffAuth } = useAuth();
  const navigate = useNavigate();

  // Hide the switcher in production builds
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleQuickLogin = async (type, email, password, redirectPath) => {
    setLoading(true);
    setError(null);
    try {
      if (type === 'customer') {
        const res = await customerLogin(email, password);
        if (res.success) {
          loginCustomer(res.data.user, res.data.token);
          navigate(redirectPath);
        }
      } else {
        const res = await staffLogin(email, password);
        if (res.success) {
          loginStaff(res.data.user, res.data.token);
          navigate(redirectPath);
        }
      }
    } catch (err) {
      setError(err.message || `Login failed for ${email}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    logoutCustomer();
    logoutStaff();
    navigate('/');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-3 rounded-full bg-brand-primary text-brand-light shadow-xl shadow-brand-darker/60 hover:bg-brand-primary/95 hover:scale-105 transition-all"
        title="Toggle Developer Quick-Login Switcher"
      >
        {isOpen ? <ChevronRight size={20} /> : <Sparkles size={20} className="animate-pulse" />}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="mr-3 w-80 bg-brand-darker/95 border border-brand-primary/20 backdrop-blur-xl rounded-3xl p-5 shadow-2xl text-left animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2 text-brand-primary">
              <Terminal size={16} />
              <span className="text-xs font-black uppercase tracking-wider">Dev Quick Switcher</span>
            </div>
            <span className="text-[9px] bg-brand-primary/15 text-brand-primary font-bold px-1.5 py-0.5 rounded-full uppercase">Local Dev</span>
          </div>

          {error && (
            <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-xl leading-snug">
              {error}
            </p>
          )}

          {/* Current Sessions Status */}
          <div className="text-[10px] space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-brand-light/60">Customer Session:</span>
              {customerAuth.isLoggedIn ? (
                <span className="text-green-400 font-bold">Logged In ({customerAuth.name?.split(' ')[0]})</span>
              ) : (
                <span className="text-brand-light/30">None</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-brand-light/60">Staff Session:</span>
              {staffAuth.isLoggedIn ? (
                <span className="text-amber-400 font-bold">Logged In ({staffAuth.role})</span>
              ) : (
                <span className="text-brand-light/30">None</span>
              )}
            </div>
          </div>

          {/* Quick Login Profiles */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-extrabold uppercase text-brand-light/50 tracking-wider">Simulate Accounts:</p>
            
            {/* Customer Button */}
            <button
              onClick={() => handleQuickLogin('customer', 'rajesh.kumar@gmail.com', 'Customer@1234', '/account')}
              disabled={loading}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-brand-light text-xs font-bold transition-all"
            >
              <span>Customer Portal</span>
              <span className="text-[9px] text-brand-light/50 font-normal">rajesh.kumar@gmail.com</span>
            </button>

            {/* Admin/Manager Button */}
            <button
              onClick={() => handleQuickLogin('staff', 'ravi.sharma@pizzajoint.com', 'Admin@1234', '/admin')}
              disabled={loading}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/25 text-brand-primary text-xs font-bold transition-all"
            >
              <span>Admin Dashboard</span>
              <span className="text-[9px] text-brand-primary/60 font-normal">ravi.sharma@pizzajoint.com</span>
            </button>

            {/* Cook/Chef Button */}
            <button
              onClick={() => handleQuickLogin('staff', 'sunita.verma@pizzajoint.com', 'Staff@1234', '/staff/kitchen')}
              disabled={loading}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-500 text-xs font-bold transition-all"
            >
              <span>Kitchen Screen</span>
              <span className="text-[9px] text-amber-500/60 font-normal">sunita.verma@pizzajoint.com</span>
            </button>
          </div>

          {/* Utilities */}
          <div className="border-t border-white/5 pt-3 flex justify-between items-center">
            <button
              onClick={handleLogoutAll}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 text-[10px] font-bold transition-all"
            >
              <LogOut size={12} />
              <span>Clear All Sessions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DevLoginSwitcher;
