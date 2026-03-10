import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, refreshToken as apiRefresh, logout as apiLogout } from '../services/authService';
import { setAccessToken as setAxiosToken } from '../services/api';

interface AuthContextType {
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true); 


  useEffect(() => {
    apiRefresh()
      .then(data => {
        setAxiosToken(data.token);
        setAccessToken(data.token);
      })
      .catch(() => {
        // No valid refresh token — user must log in
      })
      .finally(() => setIsRestoring(false));
  }, []);

  const login = async (email: string, password: string) => {
    // Server sets refreshToken as httpOnly cookie automatically
    const data = await apiLogin(email, password);
    setAccessToken(data.token);
    setAxiosToken(data.token);
  };

  const logout = async () => {
    try {
      await apiLogout(); // tells the server to clear the httpOnly cookie
    } catch { /* ignore */ }
    setAccessToken(null);
    setAxiosToken(null);
  };

  // Call this before any authenticated request — refreshes if expired
  const getAccessToken = useCallback(async () => {
    if (accessToken) return accessToken;
    try {
      // Cookie is sent automatically; server returns a new access token
      const data = await apiRefresh();
      setAccessToken(data.token);
      setAxiosToken(data.token);
      return data.token;
    } catch {
      setAccessToken(null);
      setAxiosToken(null);
      return null;
    }
  }, [accessToken]);

   if (isRestoring) return null; // or a loading spinner

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);