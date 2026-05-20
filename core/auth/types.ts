export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // unix ms
};

export type AuthUser = {
  sub: string;
  preferred_username?: string;
  email?: string;
  name?: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
