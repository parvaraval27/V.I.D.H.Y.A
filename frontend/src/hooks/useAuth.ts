// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface User {
  _id: string;
  username: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      window.location.href = '/';
      return { success: true };
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid email or password';
      setLoginError(message);
      return { 
        success: false, 
        error: message, 
      };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async ({ username, email, password }: { username: string; email: string; password: string }) => {
    setLoginError(null);
    try {
      await api.post('/auth/register', { username, email, password });
      return { success: true };
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Registration failed';
      setLoginError(message);
      return { 
        success: false, 
        error: message, 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return {
    user,
    loading,
    isLoggingIn,
    loginError,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};