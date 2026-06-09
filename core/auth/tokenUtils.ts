import { AuthUser, TokenSet } from "./types";
import { AppConfig } from "../config/types";

export const isTokenExpired = (tokens: TokenSet): boolean =>
  Date.now() >= tokens.expiresAt - 30_000; // 30s buffer

export const decodeJwt = (token: string): AuthUser => {
  const payload = token.split(".")[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as AuthUser;
};

export const refreshTokens = async (
  refreshToken: string,
  config: AppConfig,
): Promise<TokenSet> => {
  const res = await fetch(
    `${config.keycloakUrl}/realms/${config.realm}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        refresh_token: refreshToken,
      }).toString(),
    },
  );

  if (!res.ok) throw new Error("Token refresh failed");

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    idToken: data.id_token ?? "",
    expiresAt: Date.now() + data.expires_in * 1000,
  };
};
