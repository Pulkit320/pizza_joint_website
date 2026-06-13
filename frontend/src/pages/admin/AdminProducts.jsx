/**
 * @file        AdminProducts.jsx
 * @module      pages/admin
 * @description Page component listing database menu catalog items with metadata details.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import productService from '../../services/productService';
import { ShoppingBag, Eye, Star, Flame } from 'lucide-react';

/**
 * @function  AdminProducts
 * @summary   Product management view displaying lists of food items
 * @returns   {React.ReactElement} AdminProducts layout markup
 */
function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve products.');
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

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Product Catalog</h1>
          <p className="text-xs text-brand-light/60">Manage menu inventory, categories, pricing, and active highlight tags.</p>
        </div>
        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-brand-light text-xs font-bold">
          <ShoppingBag size={14} />
          <span>{products.length} Products</span>
        </div>
      </div>

      {error ? (
        <div className="glass-card p-6 border border-brand-legend/20 text-center max-w-sm mx-auto">
          <p className="text-xs text-brand-legend">{error}</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-brand-light/50 font-bold uppercase tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Menu Item Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Active Sizing</th>
                  <th className="p-4 text-right">Base Price</th>
                  <th className="p-4 text-center">Status Indicators</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 flex items-center space-x-3.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-xl border border-white/5"
                      />
                      <div>
                        <h4 className="font-bold text-white leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-brand-light/40 leading-snug mt-0.5 line-clamp-1">{item.description}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-brand-light/80">{item.category}</td>
                    <td className="p-4 text-center text-brand-light/50">
                      {item.category === 'Sides' || item.category === 'Desserts' ? 'Standard Only' : 'S / M / L'}
                    </td>
                    <td className="p-4 text-right font-extrabold text-white">₹{item.price}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        {item.isPopular && (
                          <span className="flex items-center space-x-0.5 px-2 py-0.5 rounded bg-brand-secondary/15 text-[9px] font-bold uppercase tracking-wide text-brand-secondary border border-brand-secondary/25">
                            <Flame size={8} fill="currentColor" />
                            <span>Popular</span>
                          </span>
                        )}
                        {item.isProductOfWeek && (
                          <span className="flex items-center space-x-0.5 px-2 py-0.5 rounded bg-brand-primary/15 text-[9px] font-bold uppercase tracking-wide text-brand-primary border border-brand-primary/25">
                            <Star size={8} fill="currentColor" />
                            <span>POW Highlight</span>
                          </span>
                        )}
                        {!item.isPopular && !item.isProductOfWeek && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-light/30">Standard</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
