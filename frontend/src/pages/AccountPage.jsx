/**
 * @file        AccountPage.jsx
 * @module      pages
 * @description Page component allowing customer profile updates and notifications configuration.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, CheckCircle, Save } from 'lucide-react';

/**
 * @function  AccountPage
 * @summary   Renders the customer profile editor dashboard
 * @returns   {React.ReactElement} AccountPage layout markup
 */
function AccountPage() {
  const auth = useContext(AuthContext);

  if (!auth) {
    return null;
  }

  const { user, updateUser } = auth;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setMarketingEmails(user.preferences?.marketingEmails ?? true);
      setSmsNotifications(user.preferences?.smsNotifications ?? false);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate updating user profile in AuthContext
    updateUser({
      name,
      email,
      phone,
      preferences: {
        marketingEmails,
        smsNotifications,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in text-left">
      <div className="glass-card p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Account Profile</h1>
          <p className="text-xs text-brand-light/60">Update your profile parameters and communication preferences.</p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle size={16} />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary border-b border-white/5 pb-2">
              Profile Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="phone-field" className="label-text">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/30">
                    <Phone size={16} />
                  </span>
                  <input
                    id="phone-field"
                    type="tel"
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-10 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary border-b border-white/5 pb-2">
              Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Marketing Emails</h4>
                  <p className="text-[10px] text-brand-light/50">Receive notifications on active coupons, promo releases, and EOTW announcements.</p>
                </div>
                <label htmlFor="marketing-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="marketing-toggle"
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-light after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-brand-dark"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">SMS Status Alerts</h4>
                  <p className="text-[10px] text-brand-light/50">Receive text notifications during preparation and delivery status transitions.</p>
                </div>
                <label htmlFor="sms-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="sms-toggle"
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-light after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-brand-dark"></div>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5"
          >
            <Save size={14} />
            <span>Save Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AccountPage;
