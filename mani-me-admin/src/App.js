import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Users from './pages/Users';
import UKDrivers from './pages/UKDrivers';
import GhanaDrivers from './pages/GhanaDrivers';
import GroceryShop from './pages/GroceryShop';
import PackagingShop from './pages/PackagingShop';
import PackagingOrders from './pages/PackagingOrders';
import PromoCodes from './pages/PromoCodes';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import ParcelPrices from './pages/ParcelPrices';
import ParcelItems from './pages/ParcelItems';
import CashReconciliation from './pages/CashReconciliation';
import theme from './theme';
import api from './api';
import { ENDPOINTS, APP_CONFIG } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const response = await api.get(ENDPOINTS.VERIFY);
        if (response.data.valid) {
          setIsAuthenticated(true);
          // Check if should show onboarding
          const hasSeenOnboarding = localStorage.getItem('adminHasSeenOnboarding');
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }
        } else {
          // Token invalid - clear storage and redirect to login
          localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
          localStorage.removeItem(APP_CONFIG.ADMIN_ID_KEY);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Token verification failed - clear storage
        console.error('Token verification failed:', error);
        localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
        localStorage.removeItem(APP_CONFIG.ADMIN_ID_KEY);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem(APP_CONFIG.TOKEN_KEY, token);
    setIsAuthenticated(true);
    // Check if should show onboarding
    const hasSeenOnboarding = localStorage.getItem('adminHasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    localStorage.removeItem(APP_CONFIG.ADMIN_ID_KEY);
    // Also remove any old token keys for backward compatibility
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Show loading spinner while verifying token
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            backgroundColor: '#f5f5f5'
          }}
        >
          <CircularProgress size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  // Show onboarding if authenticated but hasn't seen it
  if (isAuthenticated && showOnboarding) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Onboarding onComplete={handleOnboardingComplete} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route
            path="/"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <Dashboard />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/orders"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <Orders />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/users"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <Users />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/uk-drivers"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <UKDrivers />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/ghana-drivers"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <GhanaDrivers />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/grocery-shop"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <GroceryShop />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/packaging-shop"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <PackagingShop />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/packaging-orders"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <PackagingOrders />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/promo-codes"
            element={
              isAuthenticated ? 
              <Layout onLogout={handleLogout}>
                <PromoCodes />
              </Layout> : 
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/parcel-prices"
            element={
              isAuthenticated ?
              <Layout onLogout={handleLogout}>
                <ParcelPrices />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/parcel-items"
            element={
              isAuthenticated ?
              <Layout onLogout={handleLogout}>
                <ParcelItems />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/cash-reconciliation"
            element={
              isAuthenticated ?
              <Layout onLogout={handleLogout}>
                <CashReconciliation />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ?
              <Layout onLogout={handleLogout}>
                <Settings />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
          <Route
            path="/grocery-shop"
            element={
              isAuthenticated ?
              <Layout onLogout={handleLogout}>
                <GroceryShop />
              </Layout> :
              <Navigate to="/login" replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
