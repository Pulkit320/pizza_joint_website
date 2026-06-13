/**
 * @file        MenuPage.jsx
 * @module      pages
 * @description Page component displaying a filterable, searchable menu catalog.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useState, useEffect, useContext } from 'react';
import productService from '../services/productService';
import { CartContext } from '../context/CartContext';
import { Search, ShoppingBag, Flame, AlertCircle } from 'lucide-react';

/**
 * @function  MenuPage
 * @summary   Renders the menu page with filtering, searching, sorting, and sizing options
 * @returns   {React.ReactElement} MenuPage layout markup
 */
function MenuPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and Sorting States
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  
  // Active sizes map (stores size selection per product ID, defaults to 'Medium')
  const [selectedSizes, setSelectedSizes] = useState({});

  const cart = useContext(CartContext);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        setProducts(data);
        
        // Initialize sizes
        const defaultSizes = {};
        data.forEach(p => {
          defaultSizes[p.id] = 'Medium';
        });
        setSelectedSizes(defaultSizes);
      } catch (err) {
        setError(err.message || 'Failed to retrieve menu. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const handleSizeChange = (productId, size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  };

  const handleAddToCart = (product) => {
    if (!cart) return;

    const size = selectedSizes[product.id] || 'Medium';
    let sizePriceMultiplier = 1;
    if (size === 'Small') sizePriceMultiplier = 0.85;
    if (size === 'Large') sizePriceMultiplier = 1.25;

    const finalPrice = Math.round(product.price * sizePriceMultiplier);

    cart.addToCart({
      id: product.id,
      name: `${product.name} (${size})`,
      price: finalPrice,
      size,
      quantity: 1,
      image: product.image
    });
  };

  // Filter Categories
  const categories = ['All', 'Vegetarian', 'Meat', 'Sides', 'Desserts'];

  const filteredProducts = products
    .filter(p => category === 'All' || p.category === category)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return a.id - b.id; // Featured default
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Our Gourmet Menu</h1>
          <p className="text-sm text-brand-light/60">Choose from Neapolitan pizzas, artisan sides, and decadent desserts.</p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-light/40">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search pizzas, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field py-2.5 text-sm sm:w-48 bg-brand-darker"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-10 border-b border-white/5 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              category === cat
                ? 'bg-brand-primary text-brand-dark shadow-md'
                : 'bg-white/5 text-brand-light/75 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-96 shimmer bg-white/5 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-8 border border-brand-legend/20 text-center max-w-md mx-auto space-y-4">
          <AlertCircle size={40} className="text-brand-legend mx-auto" />
          <h2 className="text-lg font-bold text-white">Something Went Wrong</h2>
          <p className="text-xs text-brand-light/60">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-brand-light/40">No pizzas match your filters. Try adjusting search queries!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const size = selectedSizes[product.id] || 'Medium';
            let sizePriceMultiplier = 1;
            if (size === 'Small') sizePriceMultiplier = 0.85;
            if (size === 'Large') sizePriceMultiplier = 1.25;
            const displayedPrice = Math.round(product.price * sizePriceMultiplier);

            return (
              <article key={product.id} className="glass-card glass-card-hover flex flex-col justify-between overflow-hidden">
                <div className="relative h-48 overflow-hidden border-b border-white/5">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {product.isPopular && (
                    <span className="absolute top-4 left-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-brand-secondary/90 text-white text-[10px] font-bold uppercase tracking-wider">
                      <Flame size={10} fill="currentColor" />
                      <span>Popular</span>
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">{product.category}</span>
                    <h3 className="text-base font-bold text-white tracking-tight">{product.name}</h3>
                    <p className="text-xs text-brand-light/60 leading-relaxed line-clamp-3">{product.description}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Size Selector for Pizzas */}
                    {product.category !== 'Sides' && product.category !== 'Desserts' && (
                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-brand-light/40">Size</span>
                        <div className="flex space-x-1 border border-white/10 rounded-lg p-0.5 bg-brand-darker">
                          {['Small', 'Medium', 'Large'].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSizeChange(product.id, s)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                size === s
                                  ? 'bg-brand-primary text-brand-dark'
                                  : 'text-brand-light/60 hover:text-brand-light'
                              }`}
                            >
                              {s[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="text-left">
                        <span className="text-[9px] uppercase tracking-wider text-brand-light/40 block">Price</span>
                        <span className="text-lg font-extrabold text-white">₹{displayedPrice}</span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="btn-primary px-4 py-2 text-xs flex items-center space-x-1.5"
                      >
                        <ShoppingBag size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MenuPage;
