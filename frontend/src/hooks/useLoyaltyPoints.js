/**
 * @file        useLoyaltyPoints.js
 * @module      useLoyaltyPoints
 * @description React hook to fetch and subscribe to customer loyalty points.
 * @layer       util
 * @author      Architect Agent
 * @version     1.0.0
 */

import { useState, useEffect } from 'react';

/**
 * @function  useLoyaltyPoints
 * @summary   State management hook for tracking a customer's loyalty points
 * @param     {number}  customerId - Unique identifier of the customer
 * @returns   {object}  Object containing loading state, points value, and error state
 */
function useLoyaltyPoints(customerId) {
  const [points, setPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) return;

    setIsLoading(true);
    fetch(`/api/loyalty-points/${customerId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch loyalty points');
        }
        return res.json();
      })
      .then((data) => {
        setPoints(data.loyaltyPoints);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [customerId]);

  return { points, isLoading, error };
}

export default useLoyaltyPoints;
