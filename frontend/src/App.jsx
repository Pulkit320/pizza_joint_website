/**
 * @file        App.jsx
 * @module      root
 * @description Main application component setting up router switches and layout wrappers.
 * @author      Antigravity
 * @version     1.0.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Navigation & Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import DevLoginSwitcher from './components/DevLoginSwitcher';

// Public Pages
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import PromotionsPage from './pages/PromotionsPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import StaffLoginPage from './pages/StaffLoginPage';

// Customer Portal Pages
import AccountPage from './pages/AccountPage';
import OrderPage from './pages/OrderPage';
import OrderTrackPage from './pages/OrderTrackPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RewardsPage from './pages/RewardsPage';
import ReviewPage from './pages/ReviewPage';

// Admin Pages
import AdminHome from './pages/admin/AdminHome';
import AdminSales from './pages/admin/AdminSales';
import AdminProducts from './pages/admin/AdminProducts';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminOperations from './pages/admin/AdminOperations';
import AdminLoyalty from './pages/admin/AdminLoyalty';

// Staff Stub Pages
function StaffOrdersPage() {
  const { staffAuth, logoutStaff } = useAuth();
  if (!staffAuth.isLoggedIn) {
    return <Navigate to="/staff/login" replace />;
  }
  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="border border-amber-500/20 bg-brand-darker/60 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-500">Staff Orders View</h1>
        <p className="text-xs text-brand-light/60">Active Session: {staffAuth.email} ({staffAuth.role})</p>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-brand-light/80">
          <p className="font-semibold mb-2">Simulated Order Queue</p>
          <ul className="space-y-1 text-left list-disc list-inside text-[11px] text-brand-light/60">
            <li>Order #4001 - Margherita Pizza (Preparing)</li>
            <li>Order #4002 - Pepperoni Feast (Ready)</li>
          </ul>
        </div>
        <button onClick={logoutStaff} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all w-full">
          Logout Staff
        </button>
      </div>
    </div>
  );
}

function StaffDeliveriesPage() {
  const { staffAuth, logoutStaff } = useAuth();
  if (!staffAuth.isLoggedIn) {
    return <Navigate to="/staff/login" replace />;
  }
  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="border border-amber-500/20 bg-brand-darker/60 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-500">Staff Deliveries View</h1>
        <p className="text-xs text-brand-light/60">Active Session: {staffAuth.email} ({staffAuth.role})</p>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-brand-light/80">
          <p className="font-semibold mb-2">Simulated Delivery Queue</p>
          <ul className="space-y-1 text-left list-disc list-inside text-[11px] text-brand-light/60">
            <li>Order #4001 - 123 Main St (Pending Pickup)</li>
          </ul>
        </div>
        <button onClick={logoutStaff} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all w-full">
          Logout Staff
        </button>
      </div>
    </div>
  );
}

function StaffKitchenPage() {
  const { staffAuth, logoutStaff } = useAuth();
  if (!staffAuth.isLoggedIn) {
    return <Navigate to="/staff/login" replace />;
  }
  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-left">
      <div className="border border-amber-500/20 bg-brand-darker/60 backdrop-blur-xl rounded-3xl p-8 space-y-6 shadow-2xl">
        <h1 className="text-2xl font-black text-amber-500">Staff Kitchen View</h1>
        <p className="text-xs text-brand-light/60">Active Session: {staffAuth.email} ({staffAuth.role})</p>
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-brand-light/80">
          <p className="font-semibold mb-2">Simulated Kitchen Queue</p>
          <ul className="space-y-1 text-left list-disc list-inside text-[11px] text-brand-light/60">
            <li>Margherita Pizza - Large x1 (Prep)</li>
          </ul>
        </div>
        <button onClick={logoutStaff} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all w-full">
          Logout Staff
        </button>
      </div>
    </div>
  );
}

/**
 * @function  ClientLayout
 * @summary   Standard layout wrapper for public and customer-facing pages
 * @returns   {React.ReactElement} Layout container markup
 */
function ClientLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-brand-light">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/staff/login" element={<StaffLoginPage />} />

          {/* Protected Customer Pages */}
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
          <Route path="/order/:id/track" element={<ProtectedRoute><OrderTrackPage /></ProtectedRoute>} />
          <Route path="/order-history" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
          <Route path="/review/:id" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

          {/* Protected Staff Pages */}
          <Route path="/staff/orders" element={<StaffOrdersPage />} />
          <Route path="/staff/deliveries" element={<StaffDeliveriesPage />} />
          <Route path="/staff/kitchen" element={<StaffKitchenPage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

/**
 * @function  App
 * @summary   Application root bootstrap component defining authentication state and router nodes
 * @returns   {React.ReactElement} The complete application tree markup
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Portal (Admin Layout + Nested Sub-routes) */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<AdminHome />} />
              <Route path="sales" element={<AdminSales />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="operations" element={<AdminOperations />} />
              <Route path="loyalty" element={<AdminLoyalty />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Client Portal (Navbar + Footer Layout + Sub-routes) */}
            <Route path="/*" element={<ClientLayout />} />
          </Routes>
          <DevLoginSwitcher />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
