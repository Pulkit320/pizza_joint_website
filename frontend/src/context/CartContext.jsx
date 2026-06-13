/**
 * @file        CartContext.jsx
 * @module      context
 * @description Provides shopping cart state context to components.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import React, { createContext, useReducer } from 'react';

// Create context
export const CartContext = createContext(null);

// Initial state
const initialState = {
  items: [], // Array of { id, name, price, quantity, size, image }
  loyaltyPointsToRedeem: 0,
  loyaltyDiscount: 0, // In rupees (₹)
};

/**
 * @function  cartReducer
 * @summary   Reducer function for handling cart actions and computations
 * @param     {object} state - Current cart state
 * @param     {object} action - Dispatched action with type and payload
 * @returns   {object} New cart state
 */
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id && item.size === action.payload.size
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, idx) =>
          idx === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }

      return {
        ...state,
        items: newItems,
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.id === action.payload.id && item.size === action.payload.size)
        ),
      };
    }
    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id && item.size === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'SET_LOYALTY_REDEMPTION': {
      return {
        ...state,
        loyaltyPointsToRedeem: action.payload.points,
        loyaltyDiscount: action.payload.discount,
      };
    }
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        loyaltyPointsToRedeem: 0,
        loyaltyDiscount: 0,
      };
    default:
      return state;
  }
}

/**
 * @function  CartProvider
 * @summary   Provides cart state and helper functions to children components
 * @param     {object}  props           - React component properties
 * @param     {React.ReactNode} props.children - Child elements to wrap
 * @returns   {React.ReactElement} The Context Provider markup
 */
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  /**
   * @function  addToCart
   * @summary   Adds an item to the shopping cart
   * @param     {object} item - Pizza item details
   */
  function addToCart(item) {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }

  /**
   * @function  removeFromCart
   * @summary   Removes an item from the shopping cart
   * @param     {number} id - Item unique identifier
   * @param     {string} size - Size configuration
   */
  function removeFromCart(id, size) {
    dispatch({ type: 'REMOVE_ITEM', payload: { id, size } });
  }

  /**
   * @function  updateQuantity
   * @summary   Updates the quantity of a specific item in the cart
   * @param     {number} id - Item unique identifier
   * @param     {string} size - Size configuration
   * @param     {number} quantity - Target quantity amount
   */
  function updateQuantity(id, size, quantity) {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, quantity } });
  }

  /**
   * @function  applyLoyaltyPoints
   * @summary   Sets the amount of loyalty points to redeem for checkout discount
   * @param     {number} points - Points count to redeem
   * @param     {number} conversionRate - Point-to-rupee conversion rate (e.g. 10 points = ₹1)
   */
  function applyLoyaltyPoints(points, conversionRate = 10) {
    const discount = points / conversionRate;
    dispatch({ type: 'SET_LOYALTY_REDEMPTION', payload: { points, discount } });
  }

  /**
   * @function  clearCart
   * @summary   Clears all items and resets discounts in the cart state
   */
  function clearCart() {
    dispatch({ type: 'CLEAR_CART' });
  }

  // Derived states
  const itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = state.items.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - state.loyaltyDiscount);

  const contextValue = {
    ...state,
    itemsCount,
    subtotal,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyLoyaltyPoints,
    clearCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
