/**
 * @file        apiService.js
 * @module      services
 * @description Centralized service layer for executing backend API calls using Axios.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import axios from 'axios';

// Base URL comes from environment — localhost in dev, the deployed
// backend URL in production. Never hardcode this.
const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? '/_/backend/api/v1' : '/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT from localStorage
apiService.interceptors.request.use(
  (config) => {
    let token = null;
    const isBrowser = typeof window !== 'undefined';
    const isStaffPage = isBrowser && (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/staff'));
    
    if (isStaffPage) {
      token = localStorage.getItem('staff_token') || localStorage.getItem('customer_token') || localStorage.getItem('token');
    } else {
      token = localStorage.getItem('customer_token') || localStorage.getItem('staff_token') || localStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format errors consistently
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorCode = 'UNKNOWN_ERROR';
    let humanReadableMessage = 'An unexpected error occurred.';

    if (error.response) {
      // Server responded with non-2xx status
      errorCode = error.response.data?.code || `HTTP_${error.response.status}`;
      humanReadableMessage = error.response.data?.message || error.response.statusText || humanReadableMessage;
    } else if (error.request) {
      // Request made but no response received
      errorCode = 'NETWORK_ERROR';
      humanReadableMessage = 'Could not connect to the server. Please check your internet connection.';
    } else {
      // Something happened in setting up the request
      errorCode = 'REQUEST_SETUP_ERROR';
      humanReadableMessage = error.message;
    }

    const formattedError = {
      code: errorCode,
      message: humanReadableMessage,
      originalError: error,
    };

    console.error('API Error details:', formattedError);
    return Promise.reject(formattedError);
  }
);

export default apiService;
