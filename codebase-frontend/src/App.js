import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navigation from './Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CodeExplorerPage from './pages/CodeExplorerPage';

import Search from './pages/Search';
import GenerateApiKeyPage from './pages/GenerateApiKeyPage';
import GatherSnippets from './pages/GatherSnippets';
import SubmitCode from './pages/CodeInput';
import { refreshToken } from './services/api';

// Conditional imports
let ToastContainer, toast;
try {
  const toastify = require('react-toastify');
  ToastContainer = toastify.ToastContainer;
  toast = toastify.toast;
  require('react-toastify/dist/ReactToastify.css');
} catch (e) {
  console.warn('react-toastify not found. Toast notifications will be disabled.');
}

// Define LoadingSpinner as a named function component
function LoadingSpinner() {
  return <div>Loading...</div>;
}

let ImportedLoadingSpinner;
try {
  ImportedLoadingSpinner = require('./components/LoadingSpinner').default;
} catch (e) {
  console.warn('LoadingSpinner component not found. Using fallback.');
  ImportedLoadingSpinner = LoadingSpinner;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await refreshToken();
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token refresh failed:', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    if (toast) {
      toast.info('You have been logged out.');
    }
  };

  if (isLoading) {
    return <ImportedLoadingSpinner />;
  }

  return (
    <Router>
      <div className="App flex flex-col min-h-screen">
        <Navigation isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login setIsAuthenticated={setIsAuthenticated} />
                )
              }
            />
            <Route
              path="/signup"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route path="/code-explorer" element={<CodeExplorerPage />} />
           
            <Route path="/search" element={<Search />} />
            <Route
              path="/generate-api-key"
              element={isAuthenticated ? <GenerateApiKeyPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/gather-snippets"
              element={isAuthenticated ? <GatherSnippets /> : <Navigate to="/login" />}
            />
            <Route
              path="/submit-code"
              element={isAuthenticated ? <SubmitCode /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
        <Footer />
        {ToastContainer && <ToastContainer position="bottom-right" autoClose={3000} />}
      </div>
    </Router>
  );
}

export default App;