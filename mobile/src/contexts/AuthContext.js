import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        const finalUser = {
          ...parsedUser,
          role: parsedUser.role || 'patient'
        };
        setUser(finalUser);
        api.setAuthToken(storedToken);

        // Verify token is still valid (Removed background verify to prevent accidental logout loops)
        // try {
        //   const response = await api.get('/api/auth/me');
        //   const verifiedUser = {
        //     ...response.data,
        //     role: response.data.role || parsedUser.role || 'patient'
        //   };
        //   setUser(verifiedUser);
        // } catch (error) {
        //   // Token invalid, clear storage
        //   console.log('Background auth verification failed - keeping local session for stability');
        // }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    console.log('Attempting login for:', phone);
    try {
      const response = await api.post('/api/auth/login', { phone: phone, password: password });
      console.log('Login response data:', JSON.stringify(response.data));
      const { access_token, user: userData } = response.data;

    if (!userData || !userData.role) {
      throw new Error('User profile incomplete. Please contact support.');
    }

    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    api.setAuthToken(access_token);

    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/api/auth/register', data);
    const { access_token, user: userDataRaw } = response.data;

    // Graceful fallback to prevent Fatal Null-Stack Navigation Crashes
    const userData = {
      ...userDataRaw,
      role: userDataRaw.role || data.role || 'patient'
    };

    await AsyncStorage.setItem('token', access_token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    api.setAuthToken(access_token);

    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    api.setAuthToken(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
