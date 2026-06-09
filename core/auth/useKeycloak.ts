import {
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
  exchangeCodeAsync,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useConfig } from "../config/ConfigContext";
import { TokenSet } from "./types";

WebBrowser.maybeCompleteAuthSession();

export function useKeycloak() {
  const { config } = useConfig();

  const discoveryUrl = config
    ? `${config.keycloakUrl}/realms/${config.realm}`
    : null;

  const discovery = useAutoDiscovery(discoveryUrl ?? "");

  const redirectUri = makeRedirectUri({ scheme: "homeportal" });

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: config?.clientId ?? "",
      scopes: ["openid", "profile", "email", "offline_access"],
      redirectUri,
    },
    config ? discovery : null,
  );

  const login = async (): Promise<TokenSet> => {
    if (!request || !discovery || !config) {
      throw new Error("Auth not ready — check your configuration");
    }

    const result = await promptAsync();
    if (result.type !== "success") {
      throw new Error("Login cancelled or failed");
    }

    const tokens = await exchangeCodeAsync(
      {
        clientId: config.clientId,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? "" },
      },
      discovery,
    );

    return {
      accessToken: tokens.accessToken ?? "",
      refreshToken: tokens.refreshToken ?? "",
      idToken: tokens.idToken ?? "",
      expiresAt: Date.now() + (tokens.expiresIn ?? 300) * 1000,
    };
  };

  return {
    login,
    isReady: !!request && !!discovery && !!config,
  };
}
