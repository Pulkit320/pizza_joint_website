/**
 * @file        AdminSales.jsx
 * @module      pages/admin
 * @description Page component displaying sales data using Recharts line/bar visualization tools.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';

/**
 * @function  AdminSales
 * @summary   Interactive analytics dashboard with charts and tables
 * @returns   {React.ReactElement} AdminSales layout markup
 */
function AdminSales() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await adminService.getSalesAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load sales analytics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="glass-card p-6 border border-brand-legend/20 text-center max-w-sm mx-auto">
        <p className="text-xs text-brand-legend">{error || 'Data not found.'}</p>
      </div>
    );
  }

  const { dailySales, popularPizzas } = analytics;

  // Custom colors for chart bars
  const BAR_COLORS = ['#ff9900', '#f25f5c', '#ffe066', '#247ba0', '#70c1b3'];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Sales Analytics</h1>
        <p className="text-xs text-brand-light/60">Analyze product performance and visual trends over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Daily Revenue Trend */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp size={16} className="text-brand-primary" />
              <span>Daily Revenue Trend (₹)</span>
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9900" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff9900" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#9ca3af" opacity={0.6} tickLine={false} />
                <YAxis stroke="#9ca3af" opacity={0.6} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ff9900" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pizza Sells Bar Chart */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BarChart3 size={16} className="text-brand-primary" />
              <span>Popular Pizza Orders</span>
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularPizzas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" opacity={0.6} tickFormatter={(tick) => tick.split(' ')[0]} tickLine={false} />
                <YAxis stroke="#9ca3af" opacity={0.6} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="orders" name="Orders">
                  {popularPizzas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table: Product performance breakdown */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <Award size={16} className="text-brand-primary" />
          <span>Product Performance Metrics</span>
        </h2>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-brand-light/50 font-bold uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="p-4">Pizza/Product Name</th>
                <th className="p-4 text-center">Volume Ordered</th>
                <th className="p-4 text-right">Revenue Generated</th>
                <th className="p-4 text-right">Average Price Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {popularPizzas.map((pizza, idx) => (
                <tr key={pizza.name} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-bold text-white">{pizza.name}</td>
                  <td className="p-4 text-center font-semibold text-brand-light/70">{pizza.orders} units</td>
                  <td className="p-4 text-right font-extrabold text-brand-primary">₹{pizza.revenue}</td>
                  <td className="p-4 text-right font-semibold text-brand-light/50">₹{Math.round(pizza.revenue / pizza.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminSales;
