/**
 * @file        HomePage.jsx
 * @module      pages
 * @description Page component for rendering the site landing page.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import employeeService from '../services/employeeService';
import { CartContext } from '../context/CartContext';
import { Award, Star, Pizza, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * @function  HomePage
 * @summary   Renders the home page with hero section, highlight products, and employee spotlight
 * @returns   {React.ReactElement} HomePage HTML layout
 */
function HomePage() {
  const [productOfWeek, setProductOfWeek] = useState(null);
  const [employeeOfWeek, setEmployeeOfWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const cart = useContext(CartContext);

  useEffect(() => {
    async function loadHighlights() {
      try {
        setLoading(true);
        const products = await productService.getProducts();
        const pow = products.find(p => p.isProductOfWeek) || products[0];
        setProductOfWeek(pow);

        const eotw = await employeeService.getEmployeeOfWeek();
        setEmployeeOfWeek(eotw);
      } catch (err) {
        console.error('Failed to load home page highlights:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHighlights();
  }, []);

  const handleAddProductOfWeek = () => {
    if (productOfWeek && cart) {
      cart.addToCart({
        id: productOfWeek.id,
        name: productOfWeek.name,
        price: productOfWeek.price,
        size: 'Medium',
        quantity: 1,
        image: productOfWeek.image
      });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
              <Pizza size={14} />
              <span>Gourmet Wood-Fired Oven</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Neapolitan <br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Perfection.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-brand-light/70 max-w-xl leading-relaxed">
              Every crust is hand-stretched and charred at 900°F. Earn 10% cash back in loyalty points on every single order.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/menu" className="btn-primary flex items-center space-x-2">
                <span>Explore Menu</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-secondary">
                Our Heritage
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary opacity-30 blur-2xl animate-pulse-slow"></div>
            <img
              src="/pizza_hero.png"
              alt="Bubbling Gourmet Neapolitan Pizza"
              className="relative max-w-full h-auto rounded-3xl shadow-2xl border border-white/5 hover:scale-[1.01] transition-transform duration-500"
              style={{ maxHeight: '420px' }}
            />
          </div>
        </div>
      </section>

      {/* Highlights Sections */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product of Week */}
          <div className="glass-card glass-card-hover p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">Product of the Week</h2>
                <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold">
                  Chef's Choice
                </span>
              </div>

              {loading ? (
                <div className="shimmer h-48 rounded-xl bg-white/5 mb-6"></div>
              ) : productOfWeek ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <img
                    src={productOfWeek.image}
                    alt={productOfWeek.name}
                    className="w-full h-32 object-cover rounded-xl border border-white/5 sm:col-span-1"
                  />
                  <div className="sm:col-span-2 text-left space-y-2">
                    <h3 className="text-lg font-bold text-brand-primary">{productOfWeek.name}</h3>
                    <p className="text-xs text-brand-light/60 line-clamp-3 leading-relaxed">{productOfWeek.description}</p>
                    <p className="text-lg font-extrabold text-white">₹{productOfWeek.price}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-light/40">No product highlight this week.</p>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center">
              <span className="text-xs text-brand-light/50">Available for delivery or pickup</span>
              <button
                onClick={handleAddProductOfWeek}
                disabled={loading || !productOfWeek}
                className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
              >
                <Pizza size={14} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>

          {/* Employee of Week */}
          <div className="glass-card glass-card-hover p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">Employee of the Week</h2>
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold">
                  <Award size={12} />
                  <span>Spotlight</span>
                </span>
              </div>

              {loading ? (
                <div className="shimmer h-48 rounded-xl bg-white/5 mb-6"></div>
              ) : employeeOfWeek ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <img
                    src={employeeOfWeek.photo}
                    alt={employeeOfWeek.name}
                    className="w-full h-32 object-cover rounded-xl border border-white/5 sm:col-span-1"
                  />
                  <div className="sm:col-span-2 text-left space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">{employeeOfWeek.name}</h3>
                      <span className="flex items-center space-x-0.5 text-xs text-brand-primary font-bold">
                        <Star size={12} fill="currentColor" />
                        <span>{employeeOfWeek.score}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider">{employeeOfWeek.role}</p>
                    <p className="text-xs text-brand-light/60 line-clamp-3 leading-relaxed">{employeeOfWeek.bio}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-light/40">No employee spotlight this week.</p>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center text-xs text-brand-light/50">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck size={14} className="text-brand-primary" />
                <span>Consistently rated 5 stars by customers</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
