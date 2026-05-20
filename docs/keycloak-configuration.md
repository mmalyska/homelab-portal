# Keycloak Token & Audience Configuration

This document explains how to configure Keycloak so that a single portal login produces a token accepted by all integrated services (ArgoCD, Grafana, etc.) without token exchange.

## Goal

```
Login → Keycloak (realm: home) → token { aud: ["homelab-portal", "argocd", "grafana"] }
                                              │
                                    Passed directly to each service API
```

One token, one login, no BFF required.

## How It Works

By default, Keycloak scopes a token's `aud` claim to the client it was issued for. Audience mappers extend that claim to include additional clients, allowing downstream services to validate the same token.

## Step 1 — Portal Client

Create a client for the portal in your realm (`home`):

| Setting | Value |
|---|---|
| Client ID | `homelab-portal` |
| Access Type | `public` |
| Standard Flow | enabled |
| Redirect URIs | `homeportal://`, `http://localhost:8081` |
| Scopes | `openid`, `profile`, `email`, `offline_access` |

`offline_access` is required to receive a refresh token for long-lived sessions.

## Step 2 — Audience Mappers on Portal Client

For each integrated service, add an **Audience** mapper to the portal client:

**Keycloak Admin → Clients → `homelab-portal` → Mappers → Create**

| Field | ArgoCD | Grafana |
|---|---|---|
| Mapper Type | Audience | Audience |
| Name | `argocd-audience` | `grafana-audience` |
| Included Client Audience | `argocd` | `grafana` |
| Add to access token | ON | ON |

Repeat for any future service.

### Resulting Token Payload

```json
{
  "iss": "https://keycloak.example.com/realms/home",
  "azp": "homelab-portal",
  "aud": ["homelab-portal", "argocd", "grafana"],
  "preferred_username": "user",
  ...
}
```

## Step 3 — Configure ArgoCD to Accept the Token

In `argocd-cm` ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  oidc.config: |
    name: Keycloak
    issuer: https://keycloak.example.com/realms/home
    clientID: argocd
    clientSecret: $oidc.keycloak.clientSecret
    requestedScopes:
      - openid
      - profile
      - email
```

ArgoCD validates the `aud` claim against its own `clientID`. Since the portal token includes `argocd` in `aud`, it is accepted.

> **Note:** ArgoCD also uses this config for its own login UI. The portal passes its token directly to the ArgoCD API — no redirect through ArgoCD's login flow.

## Step 4 — Configure Grafana to Accept the Token

Grafana uses the SSO session for embedded dashboards (iframe/WebView). For direct API access, configure generic OAuth:

```ini
[auth.generic_oauth]
enabled = true
name = Keycloak
client_id = grafana
client_secret = <secret>
scopes = openid profile email
auth_url = https://keycloak.example.com/realms/home/protocol/openid-connect/auth
token_url = https://keycloak.example.com/realms/home/protocol/openid-connect/token
api_url = https://keycloak.example.com/realms/home/protocol/openid-connect/userinfo
```

Grafana validates `aud` automatically against its `client_id`.

## Redirect URI Reference

| Platform | URI |
|---|---|
| iOS / Android (production) | `homeportal://` |
| Expo web (development) | `http://localhost:8081` |
| Expo Go (development) | `exp://localhost:8081` |

All redirect URIs must be added to the portal client's **Valid Redirect URIs** in Keycloak Admin.

## Troubleshooting

**`aud` claim missing a service** — check the audience mapper is on the portal client (not the service client) and "Add to access token" is ON.

**ArgoCD returns 401** — verify `clientID` in `oidc.config` matches the Keycloak client ID exactly (`argocd`).

**Grafana redirects to its own login** — this is expected for the embedded view; Grafana uses its own OAuth flow for the UI session. The portal's token is only used for direct API calls.

**`offline_access` scope rejected** — enable the `offline_access` scope on the portal client in Keycloak Admin → Client Scopes.
