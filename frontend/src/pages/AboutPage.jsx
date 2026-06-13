/**
 * @file        AboutPage.jsx
 * @module      pages
 * @description Page component displaying the brand's history, culinary philosophy, and oven details.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React from 'react';
import { Flame, Clock, Heart, Award } from 'lucide-react';

/**
 * @function  AboutPage
 * @summary   Renders the about page detailing kitchen culture, heritage, and values
 * @returns   {React.ReactElement} AboutPage layout markup
 */
function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in text-left space-y-16">
      {/* Intro Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-bold uppercase tracking-wider">
          <Award size={12} />
          <span>Our Heritage</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          The Art of the Wood-Fired Crust
        </h1>
        <p className="text-sm sm:text-base text-brand-light/60 leading-relaxed">
          Founded in 2024, Pizza Joint was born from a simple obsession: to bring authentic Neapolitan fermentation standards and premium culinary pairings under one roof.
        </p>
      </section>

      {/* Philosophy Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Flame size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">900°F Volcanic Ovens</h3>
          <p className="text-xs text-brand-light/60 leading-relaxed">
            Our custom ovens are lined with volcanic bricks imported from Vesuvius. They retain heat at an intense 900°F, flash-baking pizzas in exactly 90 seconds for that signature blistered leopard crust.
          </p>
        </div>

        <div className="glass-card p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Clock size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">48-Hour Cold Fermentation</h3>
          <p className="text-xs text-brand-light/60 leading-relaxed">
            We proof our dough slowly for 48 hours using double-zero (Type 00) wheat flour. This slow fermentation allows the gluten structure to relax, yielding a crust that is airy, chewy, and highly digestible.
          </p>
        </div>

        <div className="glass-card p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Heart size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Ethically Sourced Toppings</h3>
          <p className="text-xs text-brand-light/60 leading-relaxed">
            From local organic field mushrooms to certified San Marzano tomatoes, we believe premium toppings deserve respect. We work directly with regional micro-farms to secure fresh seasonal produce.
          </p>
        </div>
      </section>

      {/* Detail Block */}
      <section className="glass-card p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Our Kitchen Standards</h2>
            <p className="text-xs sm:text-sm text-brand-light/75 leading-relaxed">
              We operate on an open-kitchen setup. Every pizza is hand-stretched and tossed right in front of you. There are no rolling pins, no sheet-metal pans, and no conveyors. Just flour, water, yeast, salt, wood, and fire.
            </p>
            <p className="text-xs sm:text-sm text-brand-light/75 leading-relaxed">
              Our service model places equal value on employee empowerment. Our staff are compensated at fair living wages and share directly in company gains via performance incentives tied to client satisfaction reviews.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src="/pizza_week.png"
              alt="Artisan Chef Stretching Dough"
              className="max-w-full h-64 object-cover rounded-2xl border border-white/5 shadow-xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
