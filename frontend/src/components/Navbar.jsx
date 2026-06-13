/**
 * @file        Navbar.jsx
 * @module      components
 * @description Renders the responsive site navigation bar, adapting paths to logged-in user roles.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ShoppingBag, User, LogOut, Menu, X, Award, ShieldAlert } from 'lucide-react';

/**
 * @function  Navbar
 * @summary   Responsive header component managing page routing links
 * @returns   {React.ReactElement} Navigation header template
 */
function Navbar() {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!auth || !cart) {
    return null;
  }

  const { isAuthenticated, user, logout } = auth;
  const { itemsCount } = cart;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-brand-primary ${
      isActive ? 'text-brand-primary font-semibold' : 'text-brand-light/80'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-brand-darker/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              PIZZA JOINT
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-8">
            {user?.role !== 'admin' ? (
              <>
                <NavLink to="/" className={navLinkClass}>Home</NavLink>
                <NavLink to="/menu" className={navLinkClass}>Menu</NavLink>
                <NavLink to="/about" className={navLinkClass}>About</NavLink>
                <NavLink to="/promotions" className={navLinkClass}>Deals</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/admin" end className={navLinkClass}>Admin Home</NavLink>
                <NavLink to="/admin/sales" className={navLinkClass}>Sales</NavLink>
                <NavLink to="/admin/products" className={navLinkClass}>Products</NavLink>
                <NavLink to="/admin/employees" className={navLinkClass}>Staff</NavLink>
                <NavLink to="/admin/operations" className={navLinkClass}>Live Queue</NavLink>
                <NavLink to="/admin/loyalty" className={navLinkClass}>Loyalty Config</NavLink>
              </>
            )}
          </nav>

          {/* Desktop Action Items */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.role === 'customer' && (
                  <>
                    {/* Rewards Balance */}
                    <Link
                      to="/rewards"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/25 transition-all"
                    >
                      <Award size={16} />
                      <span className="text-xs font-bold tracking-wide">Rewards</span>
                    </Link>

                    {/* Cart Icon */}
                    <Link
                      to="/order"
                      className="relative p-2 rounded-full hover:bg-white/5 text-brand-light transition-all"
                      aria-label="Shopping Cart"
                    >
                      <ShoppingBag size={20} />
                      {itemsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-[10px] font-bold text-brand-dark ring-2 ring-brand-darker animate-pulse-slow">
                          {itemsCount}
                        </span>
                      )}
                    </Link>

                    {/* Order History */}
                    <NavLink to="/order-history" className={navLinkClass}>History</NavLink>
                  </>
                )}

                {/* Profile Account */}
                {user?.role === 'customer' && (
                  <Link
                    to="/account"
                    className="p-2 rounded-full hover:bg-white/5 text-brand-light transition-all"
                    aria-label="Account Settings"
                  >
                    <User size={20} />
                  </Link>
                )}

                {/* Role Badge */}
                {user?.role === 'admin' && (
                  <span className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-brand-legend bg-brand-legend/10 px-2.5 py-1 rounded-full border border-brand-legend/20">
                    <ShieldAlert size={12} />
                    <span>Admin</span>
                  </span>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-brand-light hover:bg-white/10 transition-all"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary px-5 py-2 text-xs"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && user?.role === 'customer' && (
              <Link
                to="/order"
                className="relative p-2 rounded-full text-brand-light"
              >
                <ShoppingBag size={20} />
                {itemsCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[8px] font-bold text-brand-dark">
                    {itemsCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-light hover:bg-white/5 rounded-xl transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-brand-darker py-4 px-4 space-y-3 animate-fade-in">
          <nav className="flex flex-col space-y-3">
            {user?.role !== 'admin' ? (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Home</Link>
                <Link to="/menu" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Menu</Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">About</Link>
                <Link to="/promotions" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Deals</Link>
              </>
            ) : (
              <>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Admin Home</Link>
                <Link to="/admin/sales" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Sales</Link>
                <Link to="/admin/products" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Products</Link>
                <Link to="/admin/employees" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Staff</Link>
                <Link to="/admin/operations" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Live Queue</Link>
                <Link to="/admin/loyalty" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Loyalty Config</Link>
              </>
            )}

            {isAuthenticated && user?.role === 'customer' && (
              <>
                <Link to="/rewards" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary flex items-center space-x-1">
                  <Award size={16} className="text-brand-primary" />
                  <span>Loyalty Rewards</span>
                </Link>
                <Link to="/order-history" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Order History</Link>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-brand-primary">Account Profile</Link>
              </>
            )}
          </nav>

          <div className="pt-2 border-t border-white/5">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-brand-legend/10 border border-brand-legend/30 text-xs font-bold text-brand-legend hover:bg-brand-legend/20 transition-all"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full btn-primary block text-center text-xs py-2.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
