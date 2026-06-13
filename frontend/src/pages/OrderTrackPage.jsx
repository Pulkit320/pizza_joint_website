/**
 * @file        OrderTrackPage.jsx
 * @module      pages
 * @description Page component displaying order tracking status steps and delivery estimates.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { Clock, Pizza, ShieldCheck, MapPin, Truck, ChevronRight } from 'lucide-react';

/**
 * @function  OrderTrackPage
 * @summary   Live tracking page rendering the progress timeline bar of a specific order
 * @returns   {React.ReactElement} OrderTrackPage layout markup
 */
function OrderTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Poll function to check order details
  const fetchOrderDetails = async () => {
    try {
      const data = await orderService.getOrderById(Number(id));
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  // Poll order details every 10 seconds to simulate tracking updates
  useEffect(() => {
    fetchOrderDetails();
    
    // Poll every 10s — clear interval on unmount to prevent memory leak
    const intervalId = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(intervalId);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-darker">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-brand-legend font-bold">Error Loading Order</div>
        <p className="text-xs text-brand-light/60">{error || 'Order tracking not found.'}</p>
        <Link to="/menu" className="btn-primary inline-block text-xs">Return to Menu</Link>
      </div>
    );
  }

  // Map status string to index for progress bar
  const STATUS_STEPS = [
    { key: 'received', label: 'Order Received', icon: Clock },
    { key: 'prep', label: 'In Kitchen', icon: Pizza },
    { key: 'oven', label: 'Wood-Fired Baking', icon: Pizza },
    { key: 'delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'completed', label: 'Completed', icon: ShieldCheck }
  ];

  // Helper function to find active index
  const activeStepIdx = STATUS_STEPS.findIndex(step => step.key === order.status);
  
  // Calculate remaining minutes (assuming a 30 minutes average duration)
  const totalDuration = 30;
  const elapsed = order.elapsedMinutes || 0;
  const remaining = Math.max(0, totalDuration - elapsed);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in text-left space-y-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Live Tracking</span>
        <h1 className="text-2xl font-extrabold text-white mt-1">Order #{order.id}</h1>
      </div>

      {/* Progress timeline bar */}
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
          {/* Progress bar background line (for desktop only) */}
          <div className="absolute top-[26px] left-[10%] right-[10%] h-1 bg-white/10 -z-10 hidden md:block"></div>
          
          {/* Progress bar fill line (for desktop only) */}
          {activeStepIdx > -1 && (
            <div 
              className="absolute top-[26px] left-[10%] h-1 bg-gradient-to-r from-brand-primary to-brand-secondary -z-10 hidden md:block transition-all duration-500"
              style={{ width: `${(activeStepIdx / (STATUS_STEPS.length - 1)) * 80}%` }}
            ></div>
          )}

          {STATUS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= activeStepIdx;
            const isActive = idx === activeStepIdx;

            return (
              <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2 w-full md:w-auto relative">
                <div 
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-brand-primary to-brand-secondary border-brand-primary text-brand-dark shadow-lg shadow-brand-primary/20' 
                      : 'bg-brand-darker border-white/10 text-brand-light/30'
                  } ${isActive ? 'ring-4 ring-brand-primary/20 scale-110' : ''}`}
                >
                  <Icon size={20} />
                </div>
                <div className="text-left md:text-center">
                  <span className={`text-xs font-bold block ${isCompleted ? 'text-white' : 'text-brand-light/35'}`}>
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-primary animate-pulse-slow block md:inline">
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left info box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">
              Delivery Details
            </h3>

            <div className="space-y-4 text-xs">
              {order.status !== 'completed' ? (
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Estimated Delivery Time</h4>
                    <p className="text-brand-light/60 mt-0.5">{remaining > 0 ? `${remaining} minutes remaining` : 'Arriving any second now!'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Delivered Successfully</h4>
                    <p className="text-brand-light/60 mt-0.5">Enjoy your gourmet wood-fired pizza!</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-brand-light/60">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Shipping Address</h4>
                  <p className="text-brand-light/60 mt-0.5">{order.address || '12 Baker Street, Connaught Place, New Delhi'}</p>
                </div>
              </div>

              {order.employeeName && (
                <div className="flex items-center space-x-3 border-t border-white/5 pt-4">
                  <img
                    src={order.employeePhoto}
                    alt={order.employeeName}
                    className="w-10 h-10 object-cover rounded-xl border border-white/5"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] text-brand-light/40 block font-bold uppercase tracking-wider">Assigned Driver / Chef</span>
                    <h4 className="font-bold text-white">{order.employeeName}</h4>
                  </div>
                  {order.status === 'completed' && (
                    <Link
                      to={`/review/${order.id}`}
                      className="btn-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Rate Server
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right summary box */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-light/80 border-b border-white/5 pb-2">
              Items Summary
            </h3>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="text-left">
                    <h5 className="font-bold text-white">{item.name}</h5>
                    <span className="text-[10px] text-brand-light/40">Qty: {item.quantity} × size: {item.size}</span>
                  </div>
                  <span className="font-semibold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-3 flex justify-between text-xs font-semibold">
              <span className="text-brand-light/50">Total Paid</span>
              <span className="font-extrabold text-brand-primary text-sm">₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderTrackPage;
