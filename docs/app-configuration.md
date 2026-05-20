# App Configuration

## Overview

All runtime configuration is entered by the user on first launch via the setup screen. No build-time environment variables are required. Configuration is stored locally in AsyncStorage and survives app restarts.

## Configuration Fields

| Field | Description | Example |
|---|---|---|
| `keycloakUrl` | Base URL of your Keycloak instance | `https://keycloak.home.example.com` |
| `realm` | Keycloak realm name | `home` |
| `clientId` | Portal's Keycloak client ID | `homelab-portal` |
| `argocdUrl` | ArgoCD base URL | `https://argocd.home.example.com` |
| `grafanaUrl` | Grafana base URL | `https://grafana.home.example.com` |

## First-Run Setup

On first launch, the app detects no saved configuration and routes to `/setup`. After saving, the user is routed to `/login`.

## Updating Configuration

A settings screen (accessible from the main menu) allows updating configuration post-setup using the same `useConfig().setConfig()` call. Changing `keycloakUrl`, `realm`, or `clientId` will require re-login as existing tokens will be invalid.

## Storage Implementation

Configuration is stored as a single JSON object under the key `app.config` in AsyncStorage.

```typescript
// core/config/types.ts
type AppConfig = {
  keycloakUrl: string;
  realm: string;
  clientId: string;
  argocdUrl: string;
  grafanaUrl: string;
};
```

## Adding New Service URLs

When adding a new feature integration:

1. Add the URL field to `AppConfig` in `core/config/types.ts`
2. Add the field to the setup screen `FIELDS` array in `app/setup.tsx`
3. Access it in the feature via `useConfig().config.yourNewUrl`
