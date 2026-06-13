/**
 * @file        RewardsPage.jsx
 * @module      pages
 * @description Page component displaying customer loyalty points, rewards tier, and transaction history ledger.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import loyaltyService from '../services/loyaltyService';
import { Award, Gift, Calendar, List, Clipboard, Check, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @function  RewardsPage
 * @summary   Rewards dashboard with dynamic progress meters, copy referral coupons, and points ledger logs
 * @returns   {React.ReactElement} RewardsPage layout template
 */
function RewardsPage() {
  const auth = useContext(AuthContext);
  const [account, setAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  
  const [ledgerPage, setLedgerPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!auth) return null;
  const { user } = auth;

  const loadLoyaltyDetails = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const accData = await loyaltyService.getAccount(user.id);
      setAccount(accData);

      const ledgerRes = await loyaltyService.getLedger(user.id, ledgerPage, 5);
      setLedger(ledgerRes.ledger);
      setTotalPages(ledgerRes.totalPages);
    } catch (err) {
      console.error('Failed to load loyalty details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltyDetails();
  }, [user, ledgerPage]);

  const handleCopyReferral = () => {
    if (account?.referralCode) {
      navigator.clipboard.writeText(account.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  if (loading && !account) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-darker">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tier labels & details
  const TIERS = [
    { name: "Dough", min: 0, desc: "Standard entry level. Earn 10% back in points.", border: "border-white/10" },
    { name: "Crust", min: 100, desc: "Unlock priority preparation speed and secret menu access.", border: "border-amber-500/20 text-brand-primary bg-brand-primary/5" },
    { name: "Legend", min: 500, desc: "Free delivery on all orders, private table reservations, and 25% off coupon updates.", border: "border-coral-500/20 text-brand-legend bg-brand-legend/5" }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in text-left space-y-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Loyalty Rewards</h1>
        <p className="text-xs text-brand-light/60">Unlock free food, priority services, and VIP benefits.</p>
      </div>

      {account && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Stats summary */}
          <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-brand-primary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-light/50">Rewards Balance</span>
                <Award className="text-brand-primary" size={24} />
              </div>
              <div>
                <span className="text-4xl font-extrabold text-white">{account.pointsBalance}</span>
                <span className="text-xs text-brand-light/50 ml-1.5">Points</span>
              </div>
              <p className="text-xs text-brand-light/60 leading-relaxed">
                Equivalent to <span className="font-extrabold text-white">₹{account.estimatedValue}</span> off any checkout.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 mt-6 flex flex-col space-y-3">
              <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider">Progress to next tier</span>
              
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${account.progressPercent}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] font-semibold text-brand-light/50">
                <span>Current Tier: <span className="text-brand-primary font-bold">{account.tier}</span></span>
                <span>{account.pointsBalance} / {account.nextThreshold} pts</span>
              </div>
            </div>
          </div>

          {/* Card 2: Referral code sharing */}
          <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-brand-secondary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-light/50">Refer & Earn</span>
                <Gift className="text-brand-secondary" size={24} />
              </div>
              <h3 className="text-base font-bold text-white leading-snug">Invite Friends & Earn Points</h3>
              <p className="text-xs text-brand-light/60 leading-relaxed">
                Share your referral coupon below. They get ₹100 off their first order, and you receive 150 points (₹15 value) once they checkout.
              </p>
            </div>

            <div className="pt-4 mt-6">
              <div className="flex items-center bg-brand-darker border border-white/10 rounded-xl p-1 justify-between gap-2">
                <span className="text-xs font-bold text-white px-2.5">{account.referralCode}</span>
                <button
                  onClick={handleCopyReferral}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiedReferral 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border border-white/10 text-brand-light hover:bg-white/10'
                  }`}
                >
                  {copiedReferral ? <Check size={12} /> : <Clipboard size={12} />}
                  <span>{copiedReferral ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Active Tier benefits checklist */}
          <div className="glass-card p-6 border-l-4 border-brand-light/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-light/50 mb-4 flex items-center gap-1.5">
              <List size={14} />
              <span>Program Tiers</span>
            </h3>
            
            <div className="space-y-3.5">
              {TIERS.map(tier => (
                <div key={tier.name} className={`p-2.5 border rounded-xl text-left ${tier.border} ${account.tier === tier.name ? 'ring-2 ring-brand-primary/20 scale-[1.01]' : 'opacity-70'}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold">{tier.name} Tier</span>
                    <span className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-white/5 text-brand-light/60">{tier.min}+ Points</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-brand-light/50">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Log */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4">Transaction Ledger</h2>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-brand-light/50 font-bold uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Transaction Date</th>
                  <th className="p-4">Event Description</th>
                  <th className="p-4 text-right">Points Delta</th>
                  <th className="p-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 flex items-center space-x-1.5 text-brand-light/60">
                      <Calendar size={14} />
                      <span>{entry.date}</span>
                    </td>
                    <td className="p-4 font-semibold text-white">{entry.eventType}</td>
                    <td className={`p-4 text-right font-extrabold ${entry.pointsDelta > 0 ? 'text-brand-primary' : 'text-brand-legend'}`}>
                      {entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}
                    </td>
                    <td className="p-4 text-right font-semibold text-brand-light/80">{entry.balanceAfter} pts</td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-brand-light/40">No transactions recorded. Check out items to earn rewards!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-brand-light/40">
              <span>Page {ledgerPage} of {totalPages}</span>
              <div className="flex space-x-2">
                <button
                  disabled={ledgerPage === 1}
                  onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={ledgerPage === totalPages}
                  onClick={() => setLedgerPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-50"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RewardsPage;
