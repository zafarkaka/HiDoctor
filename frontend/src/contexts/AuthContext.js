import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    return (saved === 'undefined' || saved === 'null') ? null : saved;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    if (!token || token === 'undefined' || token === 'null') {
      console.warn('AuthContext: No valid token to fetch user');
      setLoading(false);
      return;
    }
    try {
      console.log('AuthContext: Fetching current user...');
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('AuthContext: User fetch successful');
      setUser(response.data);
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      console.error(`AuthContext: Error fetching user (Status: ${status}):`, detail || error.message);

      if (status === 401) {
        console.warn('AuthContext: Session expired or invalid, logging out...');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, data);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const value = {
    user,
    token,
    loading,
    login,
    register,
    fetchUser,
    logout,
    getAuthHeader,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
