/**
 * @file        ReviewPage.jsx
 * @module      pages
 * @description Page component allowing customer ratings and server appraisal tag submissions.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import reviewService from '../services/reviewService';
import { Star, MessageSquare, ShieldCheck, Heart, User, CheckCircle } from 'lucide-react';

/**
 * @function  ReviewPage
 * @summary   Interactive ratings dashboard supporting star scores and employee feedback forms
 * @returns   {React.ReactElement} ReviewPage layout template
 */
function ReviewPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Form states - Experience
  const [overallRating, setOverallRating] = useState(5);
  const [foodQualityRating, setFoodQualityRating] = useState(5);
  const [speedRating, setSpeedRating] = useState(5);
  const [comment, setComment] = useState('');
  const [wouldOrderAgain, setWouldOrderAgain] = useState(true);

  // Form states - Employee Rating (if order has employee)
  const [employeeRating, setEmployeeRating] = useState(5);
  const [employeeComment, setEmployeeComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const oData = await orderService.getOrderById(Number(id));
      setOrder(oData);

      const revData = await reviewService.getOrderReview(Number(id));
      if (revData) {
        setExistingReview(revData);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load order information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Submit overall review
      await reviewService.submitExperienceReview(
        order.id,
        { overall: overallRating, foodQuality: foodQualityRating, speed: speedRating },
        comment,
        wouldOrderAgain
      );

      // 2. Submit employee review if assigned
      if (order.employeeId) {
        await reviewService.submitEmployeeRating(
          order.id,
          order.employeeId,
          employeeRating,
          employeeComment,
          selectedTags
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-darker">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-brand-legend font-bold">Error Loading Page</div>
        <p className="text-xs text-brand-light/60">{error}</p>
        <Link to="/order-history" className="btn-primary inline-block text-xs">Return to History</Link>
      </div>
    );
  }

  // Pre-configured praise tags for employees
  const EMP_TAGS = ['Friendly', 'Fast', 'Professional', 'Went above and beyond', 'Great communicator'];

  // Already submitted state
  if (existingReview || submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in space-y-6">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle size={32} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Review Submitted!</h1>
          <p className="text-xs text-brand-light/60">Thank you for your feedback. We share ratings directly with our kitchen and delivery staff.</p>
        </div>
        <Link to="/order-history" className="btn-primary inline-block text-xs">
          View Order History
        </Link>
      </div>
    );
  }

  // Star selector helper
  const StarSelector = ({ value, onChange, idPrefix }) => (
    <div className="flex space-x-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          id={`${idPrefix}-star-${star}`}
          onClick={() => onChange(star)}
          className={`p-1 transition-transform hover:scale-110 ${
            star <= value ? 'text-brand-primary' : 'text-brand-light/20'
          }`}
          aria-label={`Rate ${star} Stars`}
        >
          <Star size={24} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in text-left space-y-8">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Share Feedback</span>
        <h1 className="text-2xl font-extrabold text-white mt-1">Review Order #{order.id}</h1>
      </div>

      <form onSubmit={handleSubmitReview} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Feedback Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: EXPERIENCE */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary border-b border-white/5 pb-2">
              Overall Experience
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-light/80">Overall Rating</span>
                <StarSelector value={overallRating} onChange={setOverallRating} idPrefix="overall" />
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs font-semibold text-brand-light/80">Food Quality</span>
                <StarSelector value={foodQualityRating} onChange={setFoodQualityRating} idPrefix="food" />
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-xs font-semibold text-brand-light/80">Delivery / Prep Speed</span>
                <StarSelector value={speedRating} onChange={setSpeedRating} idPrefix="speed" />
              </div>

              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="comments-textarea" className="text-xs font-semibold text-brand-light/80">Written Comments</label>
                  <span className="text-[10px] text-brand-light/40">Optional</span>
                </div>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-brand-light/35">
                    <MessageSquare size={16} />
                  </span>
                  <textarea
                    id="comments-textarea"
                    rows="3"
                    placeholder="Tell us what you liked, or where we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="input-field pl-10 text-xs py-2.5 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-xs font-semibold text-brand-light/85">Would you order from us again?</span>
                <button
                  type="button"
                  id="order-again-toggle"
                  onClick={() => setWouldOrderAgain(!wouldOrderAgain)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    wouldOrderAgain
                      ? 'bg-brand-primary/10 border border-brand-primary/25 text-brand-primary'
                      : 'bg-white/5 border border-white/10 text-brand-light/60'
                  }`}
                >
                  <Heart size={14} fill={wouldOrderAgain ? 'currentColor' : 'none'} />
                  <span>{wouldOrderAgain ? 'Yes, Absolutely' : 'No'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: STAFF RATING */}
          {order.employeeName && (
            <div className="glass-card p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-primary border-b border-white/5 pb-2">
                Rate Your Server
              </h3>

              <div className="flex items-center space-x-3.5 bg-white/5 border border-white/5 p-4 rounded-xl">
                <img
                  src={order.employeePhoto}
                  alt={order.employeeName}
                  className="w-12 h-12 object-cover rounded-xl border border-white/5"
                />
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white leading-tight">{order.employeeName}</h4>
                  <p className="text-[10px] text-brand-light/50 mt-0.5">{order.employeeId === 201 ? 'Chef' : 'Delivery Driver'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-light/80">Staff Performance</span>
                  <StarSelector value={employeeRating} onChange={setEmployeeRating} idPrefix="employee" />
                </div>

                {/* Praise tags checkboard */}
                <div className="space-y-2.5 border-t border-white/5 pt-4">
                  <span className="text-xs font-semibold text-brand-light/80 block">Select Staff Praise Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {EMP_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          id={`tag-pill-${tag.toLowerCase().replace(/ /g, '-')}`}
                          onClick={() => handleToggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                              : 'bg-white/5 border-white/10 text-brand-light/50 hover:bg-white/10'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="staff-comments-textarea" className="text-xs font-semibold text-brand-light/80">Personal Note for {order.employeeName}</label>
                    <span className="text-[10px] text-brand-light/40">Optional</span>
                  </div>
                  <div className="relative">
                    <span className="absolute top-3 left-3 text-brand-light/35">
                      <User size={16} />
                    </span>
                    <textarea
                      id="staff-comments-textarea"
                      rows="2"
                      placeholder={`Say something nice to ${order.employeeName}...`}
                      value={employeeComment}
                      onChange={(e) => setEmployeeComment(e.target.value)}
                      className="input-field pl-10 text-xs py-2.5 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-2.5 text-xs font-bold"
          >
            Submit Feedback & Rate Server
          </button>
        </div>

        {/* Right Column: Order items snapshot */}
        <div>
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-light/50 border-b border-white/5 pb-2">
              Order Items
            </h3>
            
            <div className="space-y-3.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="text-left">
                    <h5 className="font-bold text-white leading-tight">{item.name}</h5>
                    <span className="text-[10px] text-brand-light/40">Qty: {item.quantity} × size: {item.size}</span>
                  </div>
                  <span className="font-semibold text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ReviewPage;
