/**
 * @file        AuthContext.jsx
 * @module      context
 * @description Provides authentication state context to components, supporting separate customer and staff logins.
 * @author      Antigravity
 * @version     1.0.0
 */

import React, { createContext, useReducer, useEffect, useContext } from 'react';
import axios from 'axios';

// Create context
export const AuthContext = createContext(null);

const defaultCustomerAuth = {
  token: null,
  userId: null,
  name: null,
  firstName: null,
  lastName: null,
  email: null,
  tier: null,
  loyaltyBalance: null,
  isLoggedIn: false,
};

const defaultStaffAuth = {
  token: null,
  userId: null,
  name: null,
  firstName: null,
  lastName: null,
  email: null,
  role: null,
  isAdmin: false,
  isLoggedIn: false,
};

// Initial state
const initialState = {
  customerAuth: { ...defaultCustomerAuth },
  staffAuth: { ...defaultStaffAuth },
  loading: true,
};

/**
 * @function  decodeJwt
 * @summary   Decodes a JWT token payload locally without external library dependencies
 * @param     {string} token - JWT token string
 * @returns   {object|null} Decoded JSON payload or null if invalid
 */
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * @function  authReducer
 * @summary   Reducer function for handling authentication state transitions
 * @param     {object} state - Current auth state
 * @param     {object} action - Dispatched action with type and payload
 * @returns   {object} New auth state
 */
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CUSTOMER_LOGIN_SUCCESS':
      return {
        ...state,
        customerAuth: {
          token: action.payload.token,
          userId: action.payload.userId || action.payload.id,
          name: action.payload.name || `${action.payload.firstName} ${action.payload.lastName}`,
          firstName: action.payload.firstName || action.payload.name?.split(' ')[0] || '',
          lastName: action.payload.lastName || action.payload.name?.split(' ')[1] || '',
          email: action.payload.email,
          tier: action.payload.tier,
          loyaltyBalance: action.payload.loyaltyBalance,
          isLoggedIn: true,
        },
        loading: false,
      };
    case 'CUSTOMER_LOGOUT':
      return {
        ...state,
        customerAuth: { ...defaultCustomerAuth },
        loading: false,
      };
    case 'STAFF_LOGIN_SUCCESS':
      return {
        ...state,
        staffAuth: {
          token: action.payload.token,
          userId: action.payload.userId || action.payload.id,
          name: action.payload.name || `${action.payload.firstName} ${action.payload.lastName}`,
          firstName: action.payload.firstName || action.payload.name?.split(' ')[0] || '',
          lastName: action.payload.lastName || action.payload.name?.split(' ')[1] || '',
          email: action.payload.email,
          role: action.payload.role,
          isAdmin: action.payload.isAdmin || action.payload.role === 'admin' || action.payload.role === 'manager',
          isLoggedIn: true,
        },
        loading: false,
      };
    case 'STAFF_LOGOUT':
      return {
        ...state,
        staffAuth: { ...defaultStaffAuth },
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        customerAuth: {
          ...state.customerAuth,
          ...action.payload,
          firstName: action.payload.firstName || state.customerAuth.firstName,
          lastName: action.payload.lastName || state.customerAuth.lastName,
          name: action.payload.name || `${action.payload.firstName || state.customerAuth.firstName} ${action.payload.lastName || state.customerAuth.lastName}`,
        },
      };
    default:
      return state;
  }
}

/**
 * @function  AuthProvider
 * @summary   Provides authentication context to all child React components
 * @param     {object}  props           - React component properties
 * @param     {React.ReactNode} props.children - Child elements to wrap
 * @returns   {React.ReactElement} The Context Provider markup
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Attempt to restore sessions from localStorage on mount
  useEffect(() => {
    async function restoreSessions() {
      // 1. Customer token restore
      const customerToken = localStorage.getItem('customer_token');
      if (customerToken) {
        try {
          const decoded = decodeJwt(customerToken);
          if (decoded) {
            dispatch({
              type: 'CUSTOMER_LOGIN_SUCCESS',
              payload: {
                token: customerToken,
                userId: decoded.userId || decoded.id,
                name: decoded.name,
                email: decoded.email,
                tier: decoded.tier,
                loyaltyBalance: decoded.loyaltyBalance,
              },
            });
          }
        } catch (err) {
          console.warn('Failed to restore customer session:', err.message);
          localStorage.removeItem('customer_token');
        }
      }

      // 2. Staff token restore
      const staffToken = localStorage.getItem('staff_token');
      if (staffToken) {
        try {
          const decoded = decodeJwt(staffToken);
          if (decoded) {
            dispatch({
              type: 'STAFF_LOGIN_SUCCESS',
              payload: {
                token: staffToken,
                userId: decoded.userId || decoded.id,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role,
                isAdmin: decoded.isAdmin,
              },
            });
          }
        } catch (err) {
          console.warn('Failed to restore staff session:', err.message);
          localStorage.removeItem('staff_token');
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    }

    restoreSessions();
  }, []);

  /**
   * @function  loginCustomer
   * @summary   Log in the customer and save token to localStorage
   */
  function loginCustomer(userData, token) {
    localStorage.setItem('customer_token', token);
    dispatch({
      type: 'CUSTOMER_LOGIN_SUCCESS',
      payload: { ...userData, token },
    });
  }

  /**
   * @function  logoutCustomer
   * @summary   Logs out the active customer and clears token from localStorage
   */
  function logoutCustomer() {
    const token = localStorage.getItem('customer_token');
    localStorage.removeItem('customer_token');
    dispatch({ type: 'CUSTOMER_LOGOUT' });

    // Optional: notify backend of logout
    if (token) {
      axios.post('http://localhost:3000/api/v1/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch((e) => console.warn('Failed to log out customer on backend:', e.message));
    }
  }

  /**
   * @function  loginStaff
   * @summary   Log in the staff/employee and save token to localStorage
   */
  function loginStaff(userData, token) {
    localStorage.setItem('staff_token', token);
    dispatch({
      type: 'STAFF_LOGIN_SUCCESS',
      payload: { ...userData, token },
    });
  }

  /**
   * @function  logoutStaff
   * @summary   Logs out the active staff member and clears token from localStorage
   */
  function logoutStaff() {
    const token = localStorage.getItem('staff_token');
    localStorage.removeItem('staff_token');
    dispatch({ type: 'STAFF_LOGOUT' });

    // Optional: notify backend of logout
    if (token) {
      axios.post('http://localhost:3000/api/v1/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch((e) => console.warn('Failed to log out staff on backend:', e.message));
    }
  }

  /**
   * @function  updateUser
   * @summary   Updates the current authenticated customer's local details
   */
  function updateUser(updatedFields) {
    dispatch({ type: 'UPDATE_USER', payload: updatedFields });
  }

  // Derive legacy states to keep existing components functional without immediate refactoring
  const isStaffLoggedIn = state.staffAuth.isLoggedIn;
  const isCustomerLoggedIn = state.customerAuth.isLoggedIn;
  
  const user = isStaffLoggedIn
    ? {
        id: state.staffAuth.userId,
        email: state.staffAuth.email,
        name: state.staffAuth.name,
        firstName: state.staffAuth.firstName,
        lastName: state.staffAuth.lastName,
        role: state.staffAuth.role,
        isAdmin: state.staffAuth.isAdmin,
      }
    : (isCustomerLoggedIn
      ? {
          id: state.customerAuth.userId,
          email: state.customerAuth.email,
          name: state.customerAuth.name,
          firstName: state.customerAuth.firstName,
          lastName: state.customerAuth.lastName,
          role: 'customer',
          tier: state.customerAuth.tier,
          loyaltyBalance: state.customerAuth.loyaltyBalance,
        }
      : null);

  const isAuthenticated = isCustomerLoggedIn || isStaffLoggedIn;

  const contextValue = {
    // Dual states
    customerAuth: state.customerAuth,
    staffAuth: state.staffAuth,
    loading: state.loading,

    // Dual handlers
    loginCustomer,
    logoutCustomer,
    loginStaff,
    logoutStaff,

    // Legacy support
    user,
    isAuthenticated,
    login: loginCustomer, // fallback to customer login
    logout: () => {
      logoutCustomer();
      logoutStaff();
    },
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @function  useAuth
 * @summary   Custom hook to retrieve authentication context values
 * @returns   {object} The complete AuthContext value map
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
