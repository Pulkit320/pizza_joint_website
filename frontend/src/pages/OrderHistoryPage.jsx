/**
 * @file        OrderHistoryPage.jsx
 * @module      pages
 * @description Page component displaying customer past orders list with paginated filters and review links.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ClipboardList, Star, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

/**
 * @function  OrderHistoryPage
 * @summary   Customer past orders logs page with paginated rows and reordering integrations
 * @returns   {React.ReactElement} OrderHistoryPage layout template
 */
function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const cart = useContext(CartContext);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await orderService.getOrderHistory(page, 5);
      setOrders(res.orders);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page]);

  const handleReorder = (oldItems) => {
    if (!cart) return;

    oldItems.forEach((item) => {
      cart.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        size: item.size || 'Medium',
        quantity: item.quantity,
        image: item.image || '/pizza_hero.png'
      });
    });

    navigate('/order');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-darker">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in text-left space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Order History</h1>
        <p className="text-xs text-brand-light/60">Manage your past transactions, review services, or place quick re-orders.</p>
      </div>

      {error ? (
        <div className="glass-card p-6 border border-brand-legend/20 text-center max-w-sm mx-auto">
          <p className="text-xs text-brand-legend">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-8 text-center max-w-md mx-auto space-y-6">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-brand-light/35">
            <ClipboardList size={24} />
          </div>
          <h2 className="text-sm font-bold text-white">No Orders Found</h2>
          <p className="text-xs text-brand-light/60">You have not placed any orders yet. Ready to try our wood-fired crusts?</p>
          <Link to="/menu" className="btn-primary inline-block text-xs">Explore Menu</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <article key={order.id} className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Order Metadata */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-white">Order #{order.id}</span>
                  <span className="text-[10px] text-brand-light/40 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                    order.status === 'completed' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-brand-light/60 space-y-1">
                  <p className="line-clamp-2">
                    <span className="font-semibold text-brand-light/80">Items: </span>
                    {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-light/80">Total Cost: </span>
                    <span className="text-white font-bold">₹{order.total}</span>
                    {order.loyaltyDiscount > 0 && <span className="text-brand-primary text-[10px] ml-1.5">(₹{order.loyaltyDiscount} Loyalty Discount)</span>}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
                {order.status !== 'completed' && order.status !== 'cancelled' ? (
                  <Link
                    to={`/order/${order.id}/track`}
                    className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
                  >
                    <Eye size={12} />
                    <span>Track Order</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to={`/review/${order.id}`}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-brand-light hover:bg-white/10 flex items-center space-x-1.5 transition-all"
                    >
                      <Star size={12} className="text-brand-primary" fill="currentColor" />
                      <span>Review</span>
                    </Link>
                    <button
                      onClick={() => handleReorder(order.items)}
                      className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
                    >
                      <RefreshCw size={12} />
                      <span>Reorder</span>
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-6 text-xs">
              <span className="text-brand-light/40">Showing page {page} of {totalPages} ({totalCount} total orders)</span>
              
              <div className="flex space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 bg-white/5 border border-white/10 text-brand-light rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 bg-white/5 border border-white/10 text-brand-light rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
