import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN_STORAGE_KEY, loginRequest, LoginResponseUser } from '../services/api';

interface AuthContextValue {
  user: LoginResponseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginError: string | null;
  isLoggingIn: boolean;
  login: (emailOrEmployeeId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'mobileWholesaleApp:authUser';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LoginResponseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [token, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (emailOrEmployeeId: string, password: string): Promise<boolean> => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const data = await loginRequest(emailOrEmployeeId, password);
      await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Login failed. Please try again.';
      setLoginError(message);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      loginError,
      isLoggingIn,
      login,
      logout,
    }),
    [user, isLoading, loginError, isLoggingIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}