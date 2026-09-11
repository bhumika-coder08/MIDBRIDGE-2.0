import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Profile } from '../types/index.js';
import { api, setAuthToken, getAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { fullName: string; email: string; password: string; role?: UserRole; nationality?: string; destinationCountry?: string; purpose?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  quickLoginAsRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
    } catch (err) {
      console.warn('Authentication token invalid or expired:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const signup = async (payload: { fullName: string; email: string; password: string; role?: UserRole; nationality?: string; destinationCountry?: string; purpose?: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/signup', payload);
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    const res = await api.put<{ profile: Profile }>('/profile', profileData);
    if (user) {
      setUser({ ...user, profile: res.profile });
    }
  };

  const quickLoginAsRole = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      USER: 'user@midbridge.io',
      ADMIN: 'admin@midbridge.io',
      AUTHORITY: 'authority@midbridge.io',
      UNIVERSITY: 'university@midbridge.io',
      VERIFIER: 'verifier@midbridge.io',
    };
    await login(roleEmailMap[role], 'Password123!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, quickLoginAsRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
