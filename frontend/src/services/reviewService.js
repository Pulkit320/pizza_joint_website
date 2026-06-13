/**
 * @file        reviewService.js
 * @module      services
 * @description Centralized service layer for executing review-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Initialize mock reviews in localStorage
if (!localStorage.getItem('mock_reviews')) {
  localStorage.setItem('mock_reviews', JSON.stringify([]));
}

/**
 * @function  submitExperienceReview
 * @summary   Submits overall order and item quality feedback
 * @param     {number} orderId - Order identifier
 * @param     {object} ratings - Ratings object: { overall, foodQuality, speed }
 * @param     {string} comment - Customer text comments
 * @param     {boolean} wouldOrderAgain - Re-order preference toggle
 * @param     {Array} itemRatings - Optional ratings per product ID: [ { productId, rating } ]
 * @returns   {Promise<object>} Status result
 * @throws    {object} Formatted error details
 */
export async function submitExperienceReview(orderId, ratings, comment, wouldOrderAgain, itemRatings = []) {
  try {
    const res = await apiService.post(`/reviews/${orderId}`, {
      overall: ratings.overall,
      foodQuality: ratings.foodQuality,
      speed: ratings.speed,
      comment,
      wouldOrderAgain,
      itemRatings
    });
    return res.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: submitExperienceReview for order ${orderId} failed, writing mock review`);
      const reviews = JSON.parse(localStorage.getItem('mock_reviews') || '[]');
      
      const newReview = {
        id: Date.now(),
        orderId: Number(orderId),
        ratings,
        comment,
        wouldOrderAgain,
        itemRatings,
        createdAt: new Date().toISOString()
      };

      // Remove existing review for this order if present
      const filteredReviews = reviews.filter(r => r.orderId !== Number(orderId));
      filteredReviews.push(newReview);
      localStorage.setItem('mock_reviews', JSON.stringify(filteredReviews));

      return { success: true, message: "Review submitted successfully!" };
    }
    throw err;
  }
}

/**
 * @function  submitEmployeeRating
 * @summary   Submits performance score and tag pills for a specific employee
 * @param     {number} orderId - Order identifier
 * @param     {number} employeeId - Employee identifier
 * @param     {number} rating - Star rating (optional)
 * @param     {string} comment - Written feedback text (optional)
 * @param     {Array} tags - Array of tags (e.g. ['Friendly', 'Fast'])
 * @returns   {Promise<object>} Status result
 * @throws    {object} Formatted error details
 */
export async function submitEmployeeRating(orderId, employeeId, rating, comment, tags = []) {
  try {
    const res = await apiService.post(`/reviews/${orderId}/employee/${employeeId}`, {
      rating,
      comment,
      tags
    });
    return res.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: submitEmployeeRating for emp ${employeeId} failed, writing mock rating`);
      const empRatings = JSON.parse(localStorage.getItem('mock_employee_ratings') || '[]');
      
      const newEmpRating = {
        id: Date.now(),
        orderId: Number(orderId),
        employeeId: Number(employeeId),
        rating,
        comment,
        tags,
        createdAt: new Date().toISOString()
      };

      const filteredRatings = empRatings.filter(r => !(r.orderId === Number(orderId) && r.employeeId === Number(employeeId)));
      filteredRatings.push(newEmpRating);
      localStorage.setItem('mock_employee_ratings', JSON.stringify(filteredRatings));

      return { success: true, message: "Employee feedback submitted successfully!" };
    }
    throw err;
  }
}

/**
 * @function  getOrderReview
 * @summary   Retrieves review details for a given order, if it exists
 * @param     {number} orderId - Order unique identifier
 * @returns   {Promise<object|null>} The review object or null
 * @throws    {object} Formatted error details
 */
export async function getOrderReview(orderId) {
  try {
    const res = await apiService.get(`/reviews/order/${orderId}`);
    return res.data.review;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn(`apiService: getOrderReview for ${orderId} failed, searching mock reviews`);
      const reviews = JSON.parse(localStorage.getItem('mock_reviews') || '[]');
      const review = reviews.find(r => r.orderId === Number(orderId));
      return review || null;
    }
    throw err;
  }
}

const reviewService = {
  submitExperienceReview,
  submitEmployeeRating,
  getOrderReview,
};

export default reviewService;
