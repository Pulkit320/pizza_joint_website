/**
 * @file        PromotionsPage.jsx
 * @module      pages
 * @description Page component displaying active promotional codes, combo deals, and loyalty details.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useState } from 'react';
import { Tag, Clipboard, Check, Gift, ShoppingCart, Sparkles } from 'lucide-react';

/**
 * @function  PromotionsPage
 * @summary   Renders the promotions page with copyable discount codes and package details
 * @returns   {React.ReactElement} PromotionsPage layout markup
 */
function PromotionsPage() {
  const [copiedCode, setCopiedCode] = useState(null);

  const PROMO_CODES = [
    { code: "WELCOME100", discount: "₹100 Off first order above ₹499", description: "Use this code at checkout to receive ₹100 flat discount on your very first order with us." },
    { code: "MIDWEEKPIZZA", discount: "Free Classic Garlic Knots", description: "Valid on Tuesdays and Wednesdays when ordering any Large size Pizza. Knots will be added automatically." },
    { code: "LEGEND25", discount: "25% Off on Legend Tier", description: "Exclusive discount code for customers in our Legend loyalty tier. Verified automatically on account status." }
  ];

  const COMBOS = [
    { name: "The Double Date Combo", price: 1099, value: 1297, savings: 198, description: "Any 2 Medium Pizzas + 1 Garlic Knots + 2 Soft Drinks.", image: "/pizza_hero.png" },
    { name: "The Solo Feast Package", price: 699, value: 848, savings: 149, description: "Any 1 Medium Pizza + 1 Tiramisu Cup + 1 Soft Drink.", image: "/pizza_week.png" }
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in text-left space-y-16">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={12} />
          <span>Active Campaign</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Gourmet Deals & Rewards
        </h1>
        <p className="text-sm sm:text-base text-brand-light/60 leading-relaxed">
          Get the most out of your orders. Copy promo codes below, view our budget-friendly combos, or redeem loyalty points.
        </p>
      </section>

      {/* Copyable Codes Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Coupons & Offer Codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROMO_CODES.map((promo) => (
            <div key={promo.code} className="glass-card p-6 flex flex-col justify-between border-t border-brand-primary/20">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-brand-primary">
                  <Tag size={16} />
                  <span className="text-xs font-extrabold uppercase tracking-wider">{promo.discount}</span>
                </div>
                <h3 className="text-base font-bold text-white">{promo.code}</h3>
                <p className="text-[11px] text-brand-light/60 leading-relaxed">{promo.description}</p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-brand-light/40">Expires Dec 31, 2026</span>
                <button
                  onClick={() => handleCopyCode(promo.code)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiedCode === promo.code
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border border-white/10 text-brand-light hover:bg-white/10'
                  }`}
                >
                  {copiedCode === promo.code ? <Check size={12} /> : <Clipboard size={12} />}
                  <span>{copiedCode === promo.code ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Combos section */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">Curated Combos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {COMBOS.map((combo) => (
            <div key={combo.name} className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <img
                src={combo.image}
                alt={combo.name}
                className="w-full h-32 object-cover rounded-xl border border-white/5 sm:col-span-1"
              />
              <div className="sm:col-span-2 text-left space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{combo.name}</h3>
                  <p className="text-xs text-brand-light/60 leading-relaxed">{combo.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-brand-light/40 line-through mr-1.5">₹{combo.value}</span>
                    <span className="text-base font-extrabold text-white">₹{combo.price}</span>
                    <span className="ml-2 text-[9px] font-bold text-brand-primary uppercase bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded">
                      Save ₹{combo.savings}
                    </span>
                  </div>
                  <Link
                    to="/menu"
                    className="flex items-center space-x-1 text-xs font-bold text-brand-primary hover:underline"
                  >
                    <span>Order Now</span>
                    <ShoppingCart size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Loyalty rules banner */}
      <section className="glass-card bg-gradient-to-r from-brand-card/30 to-brand-primary/5 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-brand-primary/10">
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-2 text-brand-primary">
            <Gift size={20} />
            <h3 className="text-lg font-bold">10% Loyalty Cash-Back Rules</h3>
          </div>
          <p className="text-xs text-brand-light/70 max-w-xl leading-relaxed">
            Every Rupee spent earns you 0.1 loyalty points. For example, spending ₹1,000 earns you 100 points, which is worth ₹10 off your next checkout. There are no exclusions: points accumulate automatically and can be redeemed on any gourmet items in your cart.
          </p>
        </div>
        <Link to="/login" className="btn-primary flex items-center space-x-2 whitespace-nowrap">
          <span>Join Loyalty Today</span>
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}

export default PromotionsPage;
