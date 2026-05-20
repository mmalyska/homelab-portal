# Architecture Overview

## Summary

Homelab Portal is a cross-platform Expo app (iOS, Android, web) that provides a unified authenticated interface to homelab services. Each service integration is an isolated vertical slice. Authentication is handled once via Keycloak SSO — the resulting token is reused across all services.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Homelab Portal                      │
│                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │   ArgoCD   │  │  Grafana   │  │  Future Feature │    │
│  │  (native)  │  │ (embedded) │  │                │    │
│  └────────────┘  └────────────┘  └────────────────┘    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  core/auth         │  core/config                 │  │
│  │  OIDC/PKCE         │  User-defined endpoints      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
          │                         │
    Keycloak SSO           ArgoCD / Grafana APIs
    (realm: home)          (token passthrough)
```

## Auth Architecture

Authentication uses PKCE (Proof Key for Code Exchange) — no client secrets are stored in the app.

```
App → Keycloak /authorize (PKCE)
    ← authorization code
App → Keycloak /token (code + verifier)
    ← access_token, refresh_token, id_token

access_token  → memory (AuthContext state)
refresh_token → AsyncStorage (persisted)
id_token      → AsyncStorage (persisted)
```

The access token is never written to persistent storage. On restart, the refresh token is used to obtain a new access token silently.

See [Keycloak Token & Audience Configuration](./keycloak-token-audience-configuration.md) for how a single token covers all services.

## Integration Modes

| Mode | When Used | How |
|---|---|---|
| **Native** | App has API access | REST calls with `Authorization: Bearer <token>` |
| **Embedded** | UI-only apps | `<iframe>` (web) or `<WebView>` (mobile); SSO session carries over |

ArgoCD starts native. Grafana starts embedded. Both can coexist.

## Routing Architecture

Expo Router file-based routing with three route groups:

```
/              → entry point; redirects based on state
/setup         → first-run configuration (no auth required)
/(auth)/login  → SSO login screen (no auth required)
/(app)/*       → auth-guarded; redirects to /login if unauthenticated
```

Boot sequence:
```
Launch → load config → load tokens
       ↓
  no config? → /setup
  no token?  → /(auth)/login
  expired?   → silent refresh → /(app)
  valid?     → /(app)
```

## Data Fetching

TanStack React Query is used per feature for server state. Each feature defines its own `QueryClient` keys — no shared query cache across domains.

```
features/argocd/hooks/useApplications.ts  → query key: ['argocd', 'applications']
features/grafana/hooks/useDashboards.ts   → query key: ['grafana', 'dashboards']
```

## Dependency Rules

```
app/         → can import from core/ and features/
features/X/  → can import from core/ only
core/        → no imports from features/ or app/
features/X/  → must NOT import from features/Y/
```

Violations of these rules are considered bugs.

## Configuration

All runtime configuration (URLs, realm, client ID) is entered by the user on first launch and stored in AsyncStorage. There are no build-time environment variables required for end users.

See [App Configuration](./app-configuration.md) for details.
