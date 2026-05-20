import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, AuthUser, TokenSet } from './types';
import { loadTokens, saveTokens, clearTokens } from './tokenStorage';
import { decodeJwt, isTokenExpired, refreshTokens } from './tokenUtils';
import { useKeycloak } from './useKeycloak';
import { useConfig } from '../config/ConfigContext';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { config } = useConfig();
  const { login: keycloakLogin } = useKeycloak();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!config) {
      setIsLoading(false);
      return;
    }
    initAuth();
  }, [config]);

  const initAuth = async () => {
    try {
      const tokens = await loadTokens();
      if (!tokens) return;

      if (isTokenExpired(tokens)) {
        const refreshed = await refreshTokens(tokens.refreshToken, config!);
        await applyTokens(refreshed);
      } else {
        await applyTokens(tokens);
      }
    } catch {
      // Refresh failed — force re-login
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const applyTokens = async (tokens: TokenSet) => {
    await saveTokens(tokens);
    setAccessToken(tokens.accessToken);
    setUser(decodeJwt(tokens.accessToken));
  };

  const login = async () => {
    const tokens = await keycloakLogin();
    await applyTokens(tokens);
  };

  const logout = async () => {
    await clearTokens();
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
