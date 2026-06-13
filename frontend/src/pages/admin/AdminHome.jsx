/**
 * @file        AdminHome.jsx
 * @module      pages/admin
 * @description Page component displaying high-level manager KPI cards and calculation buttons.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { DollarSign, ShoppingCart, Star, AlertTriangle, RefreshCw, Award, Smile } from 'lucide-react';

/**
 * @function  AdminHome
 * @summary   Administrative homepage rendering core executive KPI summaries and system triggers
 * @returns   {React.ReactElement} AdminHome layout markup
 */
function AdminHome() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcWinner, setCalcWinner] = useState(null);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSalesAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch management dashboard details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleRunEotw = async () => {
    try {
      setCalcLoading(true);
      const winner = await adminService.runEotwCalc();
      setCalcWinner(winner);
      
      // Reload analytics to update EOTW name/score if changed
      await loadAnalyticsData();
    } catch (err) {
      console.error('Failed to run employee calculation:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border border-brand-legend/20 text-center max-w-sm mx-auto">
        <p className="text-xs text-brand-legend">{error}</p>
      </div>
    );
  }

  const { summary } = analytics;
  const showReviewWarning = summary.avgReviewScore < summary.lowScoreAlertThreshold;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Administrative Overview</h1>
        <p className="text-xs text-brand-light/60">Live metrics of restaurant sales, service reviews, and employee performance.</p>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Today's Revenue */}
        <div className="glass-card p-6 flex items-center justify-between border-l-4 border-brand-primary">
          <div className="space-y-1">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider">Today's Revenue</span>
            <h3 className="text-2xl font-extrabold text-white">₹{summary.todayRevenue}</h3>
            <p className="text-[9px] text-emerald-400 font-semibold">+14.2% vs yesterday</p>
          </div>
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="glass-card p-6 flex items-center justify-between border-l-4 border-brand-secondary">
          <div className="space-y-1">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider">Orders Today</span>
            <h3 className="text-2xl font-extrabold text-white">{summary.ordersToday}</h3>
            <p className="text-[9px] text-brand-light/50 font-semibold">Average ticket: ₹{Math.round(summary.todayRevenue / summary.ordersToday)}</p>
          </div>
          <div className="p-3 bg-brand-secondary/10 rounded-xl text-brand-secondary border border-brand-secondary/20">
            <ShoppingCart size={20} />
          </div>
        </div>

        {/* Card 3: Avg Review Score */}
        <div className="glass-card p-6 flex items-center justify-between border-l-4 border-brand-light/20">
          <div className="space-y-1">
            <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider">Avg Review Score</span>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-2xl font-extrabold text-white">{summary.avgReviewScore}</h3>
              <Star size={16} fill="currentColor" className="text-brand-primary" />
            </div>
            <p className="text-[9px] text-brand-light/50 font-semibold">Target: 4.5+ average</p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl text-brand-light/80 border border-white/5">
            <Smile size={20} />
          </div>
        </div>
      </section>

      {/* Review Warning Alert Box */}
      {showReviewWarning && (
        <section className="flex items-start space-x-3.5 p-4 rounded-xl bg-brand-legend/10 border border-brand-legend/25 text-brand-legend text-xs leading-relaxed max-w-xl">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white mb-0.5">Low Customer Ratings Warning!</h4>
            <p className="text-brand-light/75">
              The average customer experience score is currently <span className="font-extrabold text-brand-legend">{summary.avgReviewScore}</span>, which falls below the warnings threshold of {summary.lowScoreAlertThreshold}. Review recent menu comments to check for preparation speed or quality issues.
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EOTW Section */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">Employee of the Week (EOTW)</h2>
              <Award className="text-brand-primary" size={20} />
            </div>

            <div className="flex items-center space-x-4 bg-white/5 border border-white/5 p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary text-sm font-extrabold">
                {summary.employeeOfWeekName.split(' ')[0][0]}
                {summary.employeeOfWeekName.split(' ')[1]?.[0] || ''}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white">{summary.employeeOfWeekName}</h4>
                <p className="text-[10px] text-brand-light/60 mt-0.5">Rating Score: <span className="text-brand-primary font-bold">{summary.employeeOfWeekScore} / 5.0</span></p>
              </div>
            </div>

            {calcWinner && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                Calculation finished. Winner: <span className="font-bold text-white">{calcWinner.name}</span> with a rating of {calcWinner.score}!
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-white/5">
            <button
              onClick={handleRunEotw}
              disabled={calcLoading}
              className="btn-primary w-full py-2 text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <RefreshCw size={14} className={calcLoading ? 'animate-spin' : ''} />
              <span>{calcLoading ? 'Computing Stars...' : 'Recalculate Employee of Week'}</span>
            </button>
          </div>
        </div>

        {/* Informative tips box */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/5 pb-3">Admin Notes & Tips</h3>
            <ul className="space-y-2 text-xs text-brand-light/60 list-disc list-inside leading-relaxed">
              <li>Check the <strong className="text-white">Live Queue</strong> page to progress order statuses in real-time.</li>
              <li>Use the <strong className="text-white">Loyalty Adjust</strong> tab to manually credit or debit points for customer service issues.</li>
              <li>View <strong className="text-white">Sales Analytics</strong> to see detailed revenue line graphs.</li>
            </ul>
          </div>
          <p className="text-[10px] text-brand-light/40 border-t border-white/5 pt-4 mt-6">
            Automatic backups are configured for midnight daily.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
