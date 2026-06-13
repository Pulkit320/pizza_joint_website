/**
 * @file        AdminDashboard.jsx
 * @module      pages/admin
 * @description Layout component rendering the administrative control panel with a sidebar and content area.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { BarChart3, Users, Settings, ShoppingBag, ShieldAlert, LogOut, LayoutDashboard, Radio } from 'lucide-react';

/**
 * @function  AdminDashboard
 * @summary   Sidebar wrapper layout for all administrative subroutes
 * @returns   {React.ReactElement} AdminDashboard layout structure
 */
function AdminDashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) return null;
  const { user, logout } = auth;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-brand-primary text-brand-dark shadow-lg shadow-brand-primary/10'
        : 'text-brand-light/60 hover:text-brand-light hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-brand-darker flex flex-col md:flex-row text-left">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-brand-darker/60 backdrop-blur-md shrink-0 flex flex-col justify-between py-6 px-4">
        <div className="space-y-8">
          {/* Admin Header Title */}
          <div className="px-4 flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-legend/10 border border-brand-legend/20 text-brand-legend">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-white uppercase">Pizza Joint</h2>
              <span className="text-[9px] font-bold text-brand-legend uppercase tracking-wider block">Admin Control</span>
            </div>
          </div>

          {/* Links list */}
          <nav className="space-y-1">
            <NavLink to="/admin" end className={linkClass}>
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/admin/sales" className={linkClass}>
              <BarChart3 size={16} />
              <span>Sales Analytics</span>
            </NavLink>
            <NavLink to="/admin/products" className={linkClass}>
              <ShoppingBag size={16} />
              <span>Product Catalog</span>
            </NavLink>
            <NavLink to="/admin/employees" className={linkClass}>
              <Users size={16} />
              <span>Staff Scorecards</span>
            </NavLink>
            <NavLink to="/admin/operations" className={linkClass}>
              <Radio size={16} />
              <span>Live Queue</span>
            </NavLink>
            <NavLink to="/admin/loyalty" className={linkClass}>
              <Settings size={16} />
              <span>Loyalty Adjust</span>
            </NavLink>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="pt-6 border-t border-white/5 mt-6 px-4 space-y-4">
          <div className="text-[10px] text-brand-light/40 font-semibold">
            Logged in as:<br />
            <span className="text-white font-bold">{user?.name || 'Administrator'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-brand-legend hover:bg-brand-legend/10 rounded-xl transition-all border border-brand-legend/10"
          >
            <LogOut size={14} />
            <span>Sign Out Panel</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 bg-brand-darker/35 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
