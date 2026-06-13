/**
 * @file        AdminOperations.jsx
 * @module      pages/admin
 * @description Page component displaying the live order queue and allowing manager status updates.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import orderService from '../../services/orderService';
import { Radio, AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';

/**
 * @function  AdminOperations
 * @summary   Live order queue tracking console with status mutation controls
 * @returns   {React.ReactElement} AdminOperations console markup
 */
function AdminOperations() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statusUpdateId, setStatusUpdateId] = useState(null);

  const loadActiveOrders = async () => {
    try {
      setLoading(true);
      // Fetch all mock orders from localStorage
      const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
      
      // Filter for active orders only (excluding completed/cancelled)
      const active = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
      
      // Sort with newest first
      setActiveOrders(active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      setError('Failed to load active operations queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveOrders();
    
    // Poll every 5s for updates
    const intervalId = setInterval(loadActiveOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setStatusUpdateId(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadActiveOrders();
    } catch (err) {
      console.error(`Failed to update status for order ${orderId}:`, err);
    } finally {
      setStatusUpdateId(null);
    }
  };

  // Helper status color classes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'received':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'prep':
        return 'bg-amber-500/10 border-amber-500/20 text-brand-primary';
      case 'oven':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'delivery':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default:
        return 'bg-white/5 border-white/10 text-brand-light/45';
    }
  };

  if (loading && activeOrders.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Live Queue Operations</h1>
          <p className="text-xs text-brand-light/60">Live feed of active orders in the kitchen. Modify statuses as they progress.</p>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider animate-pulse-slow">
          <Radio size={14} />
          <span>{activeOrders.length} Active Orders</span>
        </div>
      </div>

      {error ? (
        <div className="glass-card p-6 border border-brand-legend/20 text-center max-w-sm mx-auto">
          <p className="text-xs text-brand-legend">{error}</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto space-y-4">
          <CheckCircle size={40} className="text-emerald-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Queue Cleared</h2>
          <p className="text-xs text-brand-light/60">There are no active orders in preparation or delivery right now.</p>
          <button
            onClick={loadActiveOrders}
            className="btn-primary px-4 py-2 text-xs flex items-center space-x-1 mx-auto"
          >
            <RefreshCw size={12} />
            <span>Check Queue</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.map((order) => (
            <article key={order.id} className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
              {statusUpdateId === order.id && (
                <div className="absolute inset-0 bg-brand-darker/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                  <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                </div>
              )}

              {/* Order specifications */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-white">Order #{order.id}</span>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[10px] text-brand-light/40 flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                <div className="text-xs text-brand-light/60 space-y-1">
                  <p>
                    <strong className="text-brand-light/80">Customer: </strong>
                    <span className="text-white font-semibold">{order.customerName}</span>
                  </p>
                  <p>
                    <strong className="text-brand-light/80">Items: </strong>
                    {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                  <p>
                    <strong className="text-brand-light/80">Address: </strong>
                    {order.address || '12 Baker Street, Connaught Place, New Delhi'}
                  </p>
                </div>
              </div>

              {/* Status selectors */}
              <div className="flex items-center space-x-3 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0 shrink-0">
                <span className="text-[10px] text-brand-light/40 font-bold uppercase tracking-wider hidden sm:block">Move Status:</span>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="input-field py-2 text-xs w-full sm:w-48 bg-brand-darker"
                >
                  <option value="received">Order Received</option>
                  <option value="prep">In Kitchen (Prep)</option>
                  <option value="oven">Wood-Fired Oven</option>
                  <option value="delivery">Out for Delivery</option>
                  <option value="completed">Delivered (Complete)</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOperations;
