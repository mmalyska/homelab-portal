# Auth Flow

## Overview

Authentication uses OIDC Authorization Code flow with PKCE via `expo-auth-session`. The portal authenticates directly against Keycloak — no intermediary server required.

## Login Flow

```
1. User taps "Login with SSO"
2. App generates PKCE code_verifier + code_challenge
3. Browser opens: Keycloak /authorize?...&code_challenge=...
4. User logs in on Keycloak
5. Keycloak redirects to: homeportal://auth/callback?code=...
6. App exchanges code + code_verifier → access_token, refresh_token, id_token
7. Tokens stored; user decoded from access_token JWT
8. Router pushes to /(app)
```

## Token Storage

| Token | Storage | Reason |
|---|---|---|
| `access_token` | Memory (React state) | Short-lived; no need to persist |
| `refresh_token` | AsyncStorage | Enables silent re-auth on restart |
| `id_token` | AsyncStorage | Used for logout hint |

## App Restart Flow

```
Launch
  → load refresh_token from AsyncStorage
  → access_token expired? (checked with 30s buffer)
      yes → POST /token (grant_type=refresh_token)
              success → apply new tokens → /(app)
              failure → clear tokens → /(auth)/login
      no  → apply stored tokens → /(app)
```

## Token Refresh

Refresh is triggered in two places:

1. **On startup** — `AuthContext` checks expiry before routing
2. **On API call failure (401)** — each feature's API client should catch 401, attempt refresh once, retry, then redirect to login on second failure

```typescript
// Pattern for API clients in features/
async function fetchWithAuth(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    // trigger refresh via AuthContext, then retry once
  }
  return res;
}
```

## Logout Flow

```
1. User taps Logout
2. clearTokens() — removes refresh_token + id_token from AsyncStorage
3. AuthContext clears accessToken + user from state
4. Router replaces to /(auth)/login
```

> Keycloak session is not explicitly terminated (no end_session call). The user will be prompted to log in again on next attempt but the Keycloak browser session may still be active. For home lab use this is acceptable; add `revokeAsync` if stricter logout is needed.

## Scopes

| Scope | Purpose |
|---|---|
| `openid` | Required for OIDC; provides `id_token` |
| `profile` | `preferred_username`, `name` |
| `email` | `email` claim |
| `offline_access` | Issues a `refresh_token` for long-lived sessions |

## Redirect URIs

| Environment | URI |
|---|---|
| Production (iOS/Android) | `homeportal://` |
| Expo web dev | `http://localhost:8081` |
| Expo Go dev | `exp://localhost:8081` |

All must be registered in Keycloak under the portal client's **Valid Redirect URIs**.

## Security Notes

- PKCE prevents authorization code interception attacks — critical for public clients with no client secret
- No client secret is embedded in the app
- `offline_access` refresh tokens are long-lived; protect device access accordingly
- Access token is kept in memory only and is lost when the app is terminated
