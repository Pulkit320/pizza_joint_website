/**
 * @file        authService.js
 * @module      services
 * @description Centralized service layer for executing authentication-related API calls.
 * @author      Frontend Agent
 * @version     1.0.0
 */

import apiService from './apiService';

// Initialize mock users in localStorage if empty
const DEFAULT_USERS = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@gmail.com",
    password: "Customer@1234",
    role: "customer",
    phone: "+91 98765 43210",
    preferences: { marketingEmails: true, smsNotifications: false }
  },
  {
    id: "a1000000-0000-0000-0000-000000000001",
    name: "Ravi Sharma",
    email: "ravi.sharma@pizzajoint.com",
    password: "Admin@1234",
    role: "manager",
    phone: "+91 99999 88888",
    preferences: { marketingEmails: false, smsNotifications: true }
  },
  {
    id: "a1000000-0000-0000-0000-000000000004",
    name: "Sunita Verma",
    email: "sunita.verma@pizzajoint.com",
    password: "Staff@1234",
    role: "chef",
    phone: "+91 99999 77777",
    preferences: { marketingEmails: false, smsNotifications: false }
  }
];

// Always reset or check if mock_users contains the updated credentials
localStorage.setItem('mock_users', JSON.stringify(DEFAULT_USERS));

/**
 * @function  register
 * @summary   Registers a new user account
 * @param     {string} name - User's full name
 * @param     {string} email - Registration email address
 * @param     {string} password - Password credential
 * @returns   {Promise<object>} Auth payload including user info and JWT
 * @throws    {object} Formatted error details
 */
export async function register(name, email, password) {
  try {
    const res = await apiService.post('/auth/register', { name, email, password });
    return {
      user: res.data.data.user,
      token: res.data.data.token
    };
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: register failed, falling back to mock registration');
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      
      if (users.find(u => u.email === email)) {
        throw { code: 'EMAIL_TAKEN', message: 'This email address is already registered.' };
      }

      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: 'customer',
        phone: '',
        preferences: { marketingEmails: true, smsNotifications: true }
      };

      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));

      return {
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
        token: `mock-jwt-token-${newUser.id}`
      };
    }
    throw err;
  }
}

/**
 * @function  login
 * @summary   Authenticates user credentials and retrieves JWT
 * @param     {string} email - Account email address
 * @param     {string} password - Account password
 * @returns   {Promise<object>} Auth payload including user info and JWT
 * @throws    {object} Formatted error details
 */
/**
 * @function  customerLogin
 * @summary   Authenticates customer credentials and retrieves JWT
 * @param     {string} email - Customer email address
 * @param     {string} password - Customer password
 * @returns   {Promise<object>} Auth payload including user info and JWT
 * @throws    {object} Formatted error details
 */
export async function customerLogin(email, password) {
  try {
    const res = await apiService.post('/auth/customer/login', { email, password });
    return {
      user: res.data.data.user,
      token: res.data.data.token
    };
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: customerLogin failed, checking mock accounts');
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password && u.role === 'customer');

      if (!user) {
        throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email address or password.' };
      }

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, preferences: user.preferences, tier: 'dough', loyaltyBalance: 0 },
        token: `mock-jwt-token-${user.id}`
      };
    }
    throw err;
  }
}

/**
 * @function  staffLogin
 * @summary   Authenticates staff credentials and retrieves JWT
 * @param     {string} email - Staff email address
 * @param     {string} password - Staff password
 * @returns   {Promise<object>} Auth payload including user info and JWT
 * @throws    {object} Formatted error details
 */
export async function staffLogin(email, password) {
  try {
    const res = await apiService.post('/auth/staff/login', { email, password });
    return {
      user: res.data.data.user,
      token: res.data.data.token
    };
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: staffLogin failed, checking mock accounts');
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password && u.role !== 'customer');

      if (!user) {
        throw { code: 'INVALID_CREDENTIALS', message: 'Invalid email address or password.' };
      }

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, preferences: user.preferences, isAdmin: user.role === 'admin' || user.role === 'manager' },
        token: `mock-jwt-token-${user.id}`
      };
    }
    throw err;
  }
}

/**
 * @function  login
 * @summary   [DEPRECATED] Authenticates user credentials and retrieves JWT
 * @param     {string} email - Account email address
 * @param     {string} password - Account password
 * @returns   {Promise<object>} Auth payload including user info and JWT
 * @throws    {object} Formatted error details
 */
export async function login(email, password) {
  return customerLogin(email, password);
}

/**
 * @function  logout
 * @summary   Logs out the active user session locally
 * @returns   {Promise<boolean>} Success status of logout
 */
export async function logout() {
  try {
    const token = localStorage.getItem('customer_token') || localStorage.getItem('staff_token') || localStorage.getItem('token');
    if (token) {
      await apiService.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (err) {
    console.warn('apiService: server logout call failed or network offline');
  }
  return true;
}

/**
 * @function  getMe
 * @summary   Retrieves user session profile details via JWT
 * @returns   {Promise<object>} Authenticated user profile data
 * @throws    {object} Formatted error details
 */
export async function getMe() {
  try {
    const res = await apiService.get('/auth/me');
    return res.data.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: getMe failed, matching session token');
      const token = localStorage.getItem('customer_token') || localStorage.getItem('staff_token') || localStorage.getItem('token');
      if (!token || !token.startsWith('mock-jwt-token-')) {
        throw { code: 'UNAUTHORIZED', message: 'No valid login session found.' };
      }

      const userId = Number(token.replace('mock-jwt-token-', ''));
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.id === userId);

      if (!user) {
        throw { code: 'USER_NOT_FOUND', message: 'User session could not be retrieved.' };
      }

      return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, preferences: user.preferences };
    }
    throw err;
  }
}

/**
 * @function  updateMe
 * @summary   Updates current user's profile details
 * @param     {object} profileData - Updated fields (name, email)
 * @returns   {Promise<object>} Updated user record
 */
export async function updateMe(profileData) {
  try {
    const res = await apiService.put('/auth/me', profileData);
    return res.data.data;
  } catch (err) {
    if (err.code === 'NETWORK_ERROR' || process.env.NODE_ENV === 'development') {
      console.warn('apiService: updateMe failed, updating mock database');
      const token = localStorage.getItem('customer_token') || localStorage.getItem('staff_token') || localStorage.getItem('token');
      if (!token || !token.startsWith('mock-jwt-token-')) {
        throw { code: 'UNAUTHORIZED', message: 'No active session.' };
      }
      const userId = Number(token.replace('mock-jwt-token-', ''));
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const userIdx = users.findIndex(u => u.id === userId);
      if (userIdx === -1) {
        throw { code: 'USER_NOT_FOUND', message: 'User not found.' };
      }
      users[userIdx] = {
        ...users[userIdx],
        ...profileData,
      };
      localStorage.setItem('mock_users', JSON.stringify(users));
      return users[userIdx];
    }
    throw err;
  }
}

const authService = {
  register,
  customerLogin,
  staffLogin,
  login,
  logout,
  getMe,
  updateMe,
};

export default authService;
