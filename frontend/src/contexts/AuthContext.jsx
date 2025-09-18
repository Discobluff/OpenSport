import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:8080/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Configure axios to include cookies
  axios.defaults.withCredentials = true;

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/profile`);
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          logout();
        }
      } else {
        // Check if there's a session cookie by trying to get profile without token
        try {
          const response = await axios.get(`${API_BASE_URL}/profile`);
          setUser(response.data.user);
        } catch (error) {
          // No session cookie, user is not logged in
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const googleLogin = async () => {
    try {
      // Get the OAuth URL from the backend
      const response = await axios.get(`${API_BASE_URL}/auth/google`);
      const { url } = response.data;
      
      // Redirect to Google OAuth
      window.location.href = url;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || 'Google login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    googleLogin,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};