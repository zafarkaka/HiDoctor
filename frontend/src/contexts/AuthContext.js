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
      console.log('AuthContext DEBUG: Fetching current user with token length:', token?.length);
      console.log('AuthContext DEBUG: Token prefix:', token?.substring(0, 10));

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('AuthContext DEBUG: User fetch SUCCESSFUL');
      setUser(response.data);
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      const errorMessage = error.response?.data?.message || error.message;

      console.error(`AuthContext DEBUG ERROR: Status ${status} | Detail: ${detail} | Msg: ${errorMessage}`);
      console.error('Full Error Object for analysis:', error);

      if (status === 401) {
        console.warn('AuthContext DEBUG: Unauthorized (401). Clearing stale token...');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, phone, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { username, phone, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    // data should now include username, phone, full_name, role, password, and firebase_token
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
