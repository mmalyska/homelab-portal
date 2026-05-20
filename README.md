# Homelab Portal

A cross-platform mobile and web app (iOS, Android, web) that aggregates your homelab services into a single authenticated interface.

## Features

- **SSO login** via Keycloak (OIDC/PKCE — no stored passwords)
- **ArgoCD** — application health, sync status, manual sync triggers
- **Grafana** — embedded dashboards with SSO session passthrough
- **First-run setup** — configure your Keycloak and service URLs in-app; no build-time env vars needed
- **Vertical slice architecture** — each integration is an isolated feature domain

## Architecture

```
┌─────────────────────────────────────────────┐
│                Homelab Portal                │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  ArgoCD  │  │ Grafana  │  │  Future  │  │
│  │ feature  │  │ feature  │  │ feature  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  core/auth  │  core/config          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │                    │
    Keycloak SSO         ArgoCD / Grafana
    (PKCE flow)          (same-realm token)
```

### Token Strategy

The portal authenticates against Keycloak directly. The resulting token carries audience claims for all integrated services (`argocd`, `grafana`, etc.), so no token exchange or BFF is needed — the same token is passed to each app's API.

```
Login → Keycloak (realm: home) → token { aud: [portal, argocd, grafana] }
                                         │
                               Passed directly to each service API
```

## Project Structure

```
homelab-portal/
├── app/
│   ├── _layout.tsx          # Root layout — providers
│   ├── index.tsx            # Entry routing (setup → login → app)
│   ├── setup.tsx            # First-run configuration screen
│   ├── (auth)/
│   │   └── login.tsx        # SSO login screen
│   └── (app)/
│       ├── _layout.tsx      # Auth guard
│       ├── index.tsx        # Main menu
│       ├── argocd.tsx       # ArgoCD feature entry
│       └── grafana.tsx      # Grafana feature entry
├── core/
│   ├── auth/                # OIDC/PKCE, token storage, refresh, context
│   └── config/              # App config storage and context
└── features/
    ├── argocd/              # ArgoCD domain — API client, hooks, components
    └── grafana/             # Grafana domain — API client, hooks, components
```

## Stack

| Layer | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) + [Expo Router](https://expo.github.io/router) |
| Auth | `expo-auth-session` (PKCE) |
| Data fetching | [TanStack React Query](https://tanstack.com/query) |
| Token storage | `@react-native-async-storage/async-storage` |
| Platforms | iOS, Android, Web |

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn
- Expo CLI (`npm i -g expo-cli`)
- A running Keycloak instance with a `homelab-portal` client configured

### Keycloak Client Setup

1. Create a new client in your realm (e.g. `home`)
2. Set **Access Type** to `public`
3. Enable **Standard Flow** (Authorization Code)
4. Add redirect URIs:
   - `homeportal://` (mobile)
   - `http://localhost:8081` (Expo web dev)
5. Add **Audience mappers** for each integrated service:
   - Mapper type: `Audience`, include client audience: `argocd`
   - Mapper type: `Audience`, include client audience: `grafana`

### Install & Run

```bash
yarn install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

### First Run

On first launch the app will show a setup screen. Fill in:

- **Keycloak URL** — e.g. `https://keycloak.home.example.com`
- **Realm** — e.g. `home`
- **Client ID** — e.g. `homelab-portal`
- **ArgoCD URL** — e.g. `https://argocd.home.example.com`
- **Grafana URL** — e.g. `https://grafana.home.example.com`

These are stored locally on device and can be updated via the settings screen.

## Adding a New Feature

1. Create `features/<name>/` with `components/`, `api/`, `hooks/`, `types/`
2. Add a route at `app/(app)/<name>.tsx`
3. Add an entry to the `FEATURES` array in `app/(app)/index.tsx`
4. Add the service URL to `AppConfig` in `core/config/types.ts`

Features must not import from other feature directories — only from `core/`.

## License

MIT
