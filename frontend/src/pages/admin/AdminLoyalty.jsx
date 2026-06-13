/**
 * @file        AdminLoyalty.jsx
 * @module      pages/admin
 * @description Page component allowing manual adjustments of points balances and viewing program statistics.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import loyaltyService from '../../services/loyaltyService';
import { Award, PlusCircle, CheckCircle, Search, AlertCircle } from 'lucide-react';

/**
 * @function  AdminLoyalty
 * @summary   Loyalty dashboard with program metrics and manual customer credit adjustments
 * @returns   {React.ReactElement} AdminLoyalty layout markup
 */
function AdminLoyalty() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual Adjust Form
  const [searchId, setSearchId] = useState('101'); // Defaults to preloaded John Doe
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [pointsDelta, setPointsDelta] = useState('50');
  const [reason, setReason] = useState('Service delay courtesy');
  const [adjustSuccess, setAdjustSuccess] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await adminService.getLoyaltyOverview();
      setOverview(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve rewards program metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSearchCustomer = async (e) => {
    e?.preventDefault();
    if (!searchId) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    setAdjustSuccess(false);

    try {
      const data = await loyaltyService.getAccount(Number(searchId));
      
      // Look up customer name from mock users in localStorage
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.id === Number(searchId));
      
      setSearchResult({
        ...data,
        name: user ? user.name : 'Unknown Customer',
        email: user ? user.email : ''
      });
    } catch (err) {
      setSearchError(err.message || 'No rewards account matches this ID.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!searchResult) return;

    setAdjustLoading(true);
    setSearchError(null);

    try {
      const res = await adminService.grantPoints(
        searchResult.customerId,
        Number(pointsDelta),
        reason
      );

      setAdjustSuccess(true);
      setSearchResult(prev => ({
        ...prev,
        pointsBalance: res.pointsBalance
      }));

      // Reload program overview to update stats
      await loadOverview();
      
      // Clear fields
      setPointsDelta('50');
      setReason('Customer support adjustment');
    } catch (err) {
      setSearchError(err.message || 'Failed to adjust customer points.');
    } finally {
      setAdjustLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Loyalty Administration</h1>
        <p className="text-xs text-brand-light/60">Review loyalty statistics and manually credit points for guest relations.</p>
      </div>

      {overview && (
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-card p-5">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider block mb-1">Enrolled Guests</span>
            <span className="text-xl font-extrabold text-white">{overview.totalCustomersEnrolled}</span>
          </div>
          <div className="glass-card p-5">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider block mb-1">Total Points Circulating</span>
            <span className="text-xl font-extrabold text-brand-primary">{overview.pointsInCirculation} pts</span>
          </div>
          <div className="glass-card p-5">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider block mb-1">Avg Balance / User</span>
            <span className="text-xl font-extrabold text-white">{overview.averagePointsPerCustomer} pts</span>
          </div>
          <div className="glass-card p-5">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider block mb-1">Tiers: Legend / Crust</span>
            <span className="text-xl font-extrabold text-brand-legend">{overview.activeTiers.Legend} <span className="text-brand-light/40 text-xs">/ {overview.activeTiers.Crust}</span></span>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Customer Search & Information */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
            Search Rewards Account
          </h3>

          <form onSubmit={handleSearchCustomer} className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/35">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Enter Customer ID (e.g. 101)..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="input-field pl-10 text-xs py-2"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="btn-primary px-4 py-2 text-xs font-bold shrink-0"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchError && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-brand-legend/10 border border-brand-legend/25 text-brand-legend text-xs">
              <AlertCircle size={16} />
              <span>{searchError}</span>
            </div>
          )}

          {searchResult && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-bold text-white">{searchResult.name}</h4>
                  <p className="text-[10px] text-brand-light/40">{searchResult.email}</p>
                </div>
                <span className="flex items-center space-x-0.5 text-[10px] text-brand-primary font-bold uppercase bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full">
                  <Award size={10} />
                  <span>{searchResult.tier} Tier</span>
                </span>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center text-xs">
                <span className="text-brand-light/50">Current Points Balance</span>
                <span className="font-extrabold text-white">{searchResult.pointsBalance} Points</span>
              </div>
            </div>
          )}
        </div>

        {/* Manual adjustment form */}
        {searchResult && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary border-b border-white/5 pb-2">
              Manual Balance Adjustment
            </h3>

            {adjustSuccess && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle size={16} />
                <span>Points balance updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="delta-field" className="label-text">Points Adjustment Amount</label>
                <input
                  id="delta-field"
                  type="number"
                  required
                  placeholder="e.g. 50 (or -30 to subtract)"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reason-field" className="label-text">Adjustment Reason</label>
                <input
                  id="reason-field"
                  type="text"
                  required
                  placeholder="e.g. Birthday gift, Customer service courtesy..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field text-xs py-2"
                />
              </div>

              <button
                type="submit"
                disabled={adjustLoading}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1"
              >
                <PlusCircle size={14} />
                <span>{adjustLoading ? 'Processing...' : 'Execute Adjustment'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoyalty;
