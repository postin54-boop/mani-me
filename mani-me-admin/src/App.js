import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    // Also remove any old token keys for backward compatibility
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

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
