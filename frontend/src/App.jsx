import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import useAuthStore from './contexts/useAuthStore';
import useFavoriteStore from './contexts/useFavoriteStore';

import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import EditProduct from './pages/EditProduct';
import Cart from './pages/Cart';
import Payment from './pages/Payment';

// Simple PrivateRoute wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { checkAuth, loading, isAuthenticated } = useAuthStore();
  const { fetchFavoriteIds } = useFavoriteStore();

  useEffect(() => {
    // Check if user is authenticated on initial app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavoriteIds();
    }
  }, [isAuthenticated, fetchFavoriteIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="payment/:transactionId" element={<PrivateRoute><Payment /></PrivateRoute>} />

          {/* Protected Routes */}
          <Route path="dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="checkout/:id" element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          } />
          <Route path="edit-product/:id" element={
            <PrivateRoute>
              <EditProduct />
            </PrivateRoute>
          } />
          <Route path="admin" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
