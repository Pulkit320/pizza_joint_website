/**
 * @file        Footer.jsx
 * @module      components
 * @description Renders the global page footer layout.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @function  Footer
 * @summary   Site-wide footer component with links and legal information
 * @returns   {React.ReactElement} Footer page markup
 */
function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-brand-darker py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-4">Pizza Joint</h3>
            <p className="text-xs text-brand-light/50 leading-relaxed">
              Crafting premium wood-fired Neapolitan pizzas with gourmet ingredients and delivering a rewards-driven culinary experience.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-light/80 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs text-brand-light/60">
              <li><Link to="/menu" className="hover:text-brand-primary">Gourmet Menu</Link></li>
              <li><Link to="/promotions" className="hover:text-brand-primary">Active Deals</Link></li>
              <li><Link to="/about" className="hover:text-brand-primary">Our Story</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-light/80 mb-4">Hours</h4>
            <ul className="space-y-1 text-xs text-brand-light/60">
              <li>Mon - Thu: 11:00 AM - 11:00 PM</li>
              <li>Fri - Sat: 11:00 AM - 01:00 AM</li>
              <li>Sun: 12:00 PM - 10:00 PM</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-light/80 mb-4">Contact</h4>
            <p className="text-xs text-brand-light/60 leading-relaxed">
              12 Bakery Lane, Oven District<br />
              New Delhi, DL 110001<br />
              <span className="text-brand-primary">support@pizzajoint.com</span>
            </p>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-brand-light/40">
          <p>© {new Date().getFullYear()} Pizza Joint Ltd. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-brand-primary">Privacy Policy</a>
            <a href="#" className="hover:text-brand-primary">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
