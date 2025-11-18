import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

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
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
