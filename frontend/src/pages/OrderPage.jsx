/**
 * @file        OrderPage.jsx
 * @module      pages
 * @description Page component managing customer checkout, cart adjustment, and loyalty point discounts.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import loyaltyService from '../services/loyaltyService';
import orderService from '../services/orderService';
import { Trash2, ShoppingCart, Percent, MapPin, CreditCard, ChevronRight, Gift } from 'lucide-react';

/**
 * @function  OrderPage
 * @summary   Checkout wizard for review, point redemption, and simulated payment submission
 * @returns   {React.ReactElement} OrderPage wizard layout markup
 */
function OrderPage() {
  const cart = useContext(CartContext);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!cart || !auth) {
    return null;
  }

  const { items, itemsCount, subtotal, total, loyaltyPointsToRedeem, loyaltyDiscount, updateQuantity, removeFromCart, applyLoyaltyPoints, clearCart } = cart;
  const { user } = auth;

  // Checkout Wizard steps: 'cart' | 'loyalty' | 'payment'
  const [step, setStep] = useState('cart');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsSliderVal, setPointsSliderVal] = useState(0);
  
  // Form fields
  const [address, setAddress] = useState('12 Baker Street, Connaught Place, New Delhi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch loyalty details on mount
  useEffect(() => {
    async function loadLoyalty() {
      if (!user) return;
      try {
        const details = await loyaltyService.getAccount(user.id);
        setPointsBalance(details.pointsBalance);
      } catch (err) {
        console.error('Failed to load loyalty points for checkout:', err);
      }
    }
    loadLoyalty();
  }, [user]);

  // Adjust points slider value when changing step to loyalty
  useEffect(() => {
    if (step === 'loyalty') {
      setPointsSliderVal(loyaltyPointsToRedeem);
    }
  }, [step, loyaltyPointsToRedeem]);

  const handleApplyDiscount = () => {
    // 10 points = 1 Rupee (₹)
    applyLoyaltyPoints(pointsSliderVal);
    setStep('payment');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const orderData = {
      items,
      subtotal,
      pointsRedeemed: loyaltyPointsToRedeem,
      loyaltyDiscount,
      total,
      address
    };

    try {
      const order = await orderService.createOrder(orderData);
      clearCart();
      navigate(`/order/${order.id}/track`);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  // Maximum redeemable points is restricted by the points balance, and cannot exceed the subtotal price (e.g. ₹ subtotal * 10 points)
  const maxRedeemablePoints = Math.min(pointsBalance, subtotal * 10);

  if (itemsCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in space-y-6">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-brand-light/40">
          <ShoppingCart size={32} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h1>
          <p className="text-xs text-brand-light/60">Head back to the menu to add some gourmet wood-fired pizzas.</p>
        </div>
        <Link to="/menu" className="btn-primary inline-block">
          View Menu Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in text-left">
      {/* Checkout Progress Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8 text-xs font-bold uppercase tracking-wider text-brand-light/40">
        <button
          onClick={() => setStep('cart')}
          className={`pb-1 ${step === 'cart' ? 'text-brand-primary border-b-2 border-brand-primary' : 'hover:text-brand-light'}`}
        >
          1. Review Cart
        </button>
        <ChevronRight size={14} />
        <button
          onClick={() => setStep('loyalty')}
          disabled={step === 'cart'}
          className={`pb-1 ${step === 'loyalty' ? 'text-brand-primary border-b-2 border-brand-primary' : 'disabled:opacity-50 disabled:pointer-events-none hover:text-brand-light'}`}
        >
          2. Redeem Rewards
        </button>
        <ChevronRight size={14} />
        <button
          onClick={() => setStep('payment')}
          disabled={step === 'cart' || step === 'loyalty'}
          className={`pb-1 ${step === 'payment' ? 'text-brand-primary border-b-2 border-brand-primary' : 'disabled:opacity-50 disabled:pointer-events-none hover:text-brand-light'}`}
        >
          3. Payment & Submit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form / Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: CART REVIEW */}
          {step === 'cart' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-white">Cart Items ({itemsCount})</h2>
              
              <div className="divide-y divide-white/5">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="py-4 flex items-center justify-between gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-white/5"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-brand-primary font-semibold uppercase tracking-wider">{item.size} Size</p>
                      <p className="text-xs text-brand-light/60 font-semibold mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="flex items-center border border-white/10 rounded-lg p-0.5 bg-brand-darker">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="px-2 py-1 text-xs text-brand-light/60 hover:text-brand-light"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="px-2 py-1 text-xs text-brand-light/60 hover:text-brand-light"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="p-2 text-brand-light/40 hover:text-brand-legend transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep('loyalty')}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center space-x-1"
              >
                <span>Continue to Rewards</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2: LOYALTY REDEMPTION */}
          {step === 'loyalty' && (
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center space-x-2 text-brand-primary">
                <Gift size={20} />
                <h2 className="text-lg font-bold text-white">Loyalty Point Redemption</h2>
              </div>

              <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-light/60">Your Points Balance</span>
                  <span className="font-extrabold text-brand-primary">{pointsBalance} Points</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-light/60">Estimated Discount Value</span>
                  <span className="font-extrabold text-white">₹{Math.floor(pointsBalance / 10)}</span>
                </div>
              </div>

              {maxRedeemablePoints > 0 ? (
                <div className="space-y-4">
                  <label htmlFor="points-slider" className="label-text">Select points to redeem</label>
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-light/60">
                    <span>0 pts (₹0)</span>
                    <span className="text-brand-primary font-bold">{pointsSliderVal} pts (₹{Math.floor(pointsSliderVal / 10)})</span>
                    <span>{maxRedeemablePoints} pts (₹{Math.floor(maxRedeemablePoints / 10)})</span>
                  </div>
                  <input
                    id="points-slider"
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step="10"
                    value={pointsSliderVal}
                    onChange={(e) => setPointsSliderVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-brand-light/40 leading-relaxed">
                    Redemption is calculated at a rate of 10 points = ₹1. Points cannot exceed the total order value.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-brand-light/40">You don't have any redeemable points at this moment.</p>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep('cart')}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  Back
                </button>
                <button
                  onClick={handleApplyDiscount}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold"
                >
                  Apply & Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SIMULATED PAYMENT & SUBMIT */}
          {step === 'payment' && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-white">Checkout Details</h2>

              {error && (
                <div className="p-3 rounded-xl bg-brand-legend/10 border border-brand-legend/25 text-brand-legend text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                {/* Address */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-1 text-brand-light/80 text-xs font-semibold">
                    <MapPin size={14} />
                    <label htmlFor="address-field">Delivery Address</label>
                  </div>
                  <input
                    id="address-field"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field text-xs py-2.5"
                  />
                </div>

                {/* Card payment */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 text-brand-light/80 text-xs font-semibold">
                    <CreditCard size={14} />
                    <span>Card Payment Details</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 sm:col-span-2 space-y-1">
                      <label htmlFor="card-number-field" className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider">Card Number</label>
                      <input
                        id="card-number-field"
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="input-field text-xs py-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="expiry-field" className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider">Expiry</label>
                      <input
                        id="expiry-field"
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="input-field text-xs py-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="cvv-field" className="text-[10px] text-brand-light/50 font-bold uppercase tracking-wider">CVV</label>
                      <input
                        id="cvv-field"
                        type="password"
                        required
                        maxLength="3"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="input-field text-xs py-2.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('loyalty')}
                    className="btn-secondary flex-1 py-2.5 text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-2.5 text-xs font-bold"
                  >
                    {loading ? 'Processing...' : `Pay ₹${total} & Place Order`}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-light/80 border-b border-white/5 pb-2">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-light/60">Cart Subtotal</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-brand-primary">
                  <span className="flex items-center space-x-1">
                    <Percent size={12} />
                    <span>Loyalty Redemption</span>
                  </span>
                  <span className="font-semibold">-₹{loyaltyDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-brand-light/60">Estimated Delivery</span>
                <span className="font-semibold text-emerald-400">FREE</span>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between text-sm">
                <span className="font-bold text-white">Total Cost</span>
                <span className="font-extrabold text-brand-primary text-base">₹{total}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-brand-light/40">
              <span>Points Earned:</span>
              <span className="font-bold text-white">+{Math.floor(total * 0.1)} Points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;
