import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../utils/api';
import { AuthContextType, AuthUser } from '../types/user';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string): void => {
    localStorage.setItem('token', token);
    checkAuth();
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = (): boolean => user?.role === 'admin';
  const isTranslator = (): boolean => user?.role === 'translator' || user?.role === 'admin';
  const isAuthenticated = (): boolean => !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isTranslator,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
