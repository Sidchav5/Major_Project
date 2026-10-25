import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ergonomics_token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            setUser({ token, id: data.id, name: data.name, email: data.email });
          } else {
            // Token expired or invalid
            localStorage.removeItem('ergonomics_token');
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          // Don't wipe token on network error, keep offline state if needed or clear
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      localStorage.setItem('ergonomics_token', data.token);
      setUser({ token: data.token, ...data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      localStorage.setItem('ergonomics_token', data.token);
      setUser({ token: data.token, ...data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('ergonomics_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0f1d',
        color: '#60a5fa',
        fontFamily: 'Inter, sans-serif'
      }}>
        Loading session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
