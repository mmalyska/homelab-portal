# homelab-portal

Cross-platform mobile/web app (iOS, Android, web) aggregating homelab services via a unified Keycloak SSO.

## Tech Stack

- **Framework:** Expo (SDK 52+) + Expo Router (file-based routing)
- **Language:** TypeScript (strict mode)
- **Auth:** expo-auth-session (PKCE) → Keycloak
- **Data fetching:** TanStack React Query
- **Storage:** AsyncStorage (refresh token + config)
- **CI/CD:** GitHub Actions + Fastlane (TestFlight)

## Architecture

Vertical slice per feature. Dependency rules are strict:

```
features/X/  →  core/  (allowed)
features/X/  →  features/Y/  (FORBIDDEN)
core/        →  business logic  (FORBIDDEN)
```

### Directory Layout

```
app/                    # Expo Router routes
  _layout.tsx           # Root providers
  index.tsx             # Boot router (setup → login → app)
  setup.tsx             # First-run config screen
  (auth)/login.tsx      # SSO login
  (app)/                # Auth-guarded screens
core/
  auth/                 # PKCE flow, token storage, AuthContext
  config/               # AsyncStorage config, ConfigContext
features/
  argocd/               # ArgoCD native API integration
  grafana/              # Grafana WebView/iframe embed
docs/                   # Architecture, auth-flow, CI/CD, etc.
.github/workflows/      # ci.yml, android-build.yml, ios-build.yml
fastlane/               # Fastfile, Appfile, Matchfile
```

## Auth Model

- PKCE flow directly against Keycloak (no BFF)
- Single token with `aud: [homelab-portal, argocd, grafana]`
- Access token: **in memory only**
- Refresh token: AsyncStorage
- Config (keycloakUrl, realm, clientId, argocdUrl, grafanaUrl): AsyncStorage

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Format check
npx prettier --check .

# Android build (CI uses gradlew directly)
npx expo prebuild --platform android --clean

# iOS prebuild
npx expo prebuild --platform ios --clean
```

## Code Conventions

- Functional components only, hooks-first
- Query keys namespaced per feature: `['argocd', ...]`, `['grafana', ...]`
- No barrel re-exports from `core/` into `features/`
- AsyncStorage keys prefixed: `auth:`, `config:`
- All screens in `app/` are thin — business logic lives in `features/` or `core/`
- Use `expo-auth-session/providers/discovery` for OIDC discovery

## Integration Modes

| Service | Mode   | Reason                              |
|---------|--------|-------------------------------------|
| ArgoCD  | Native API | REST API available, richer UX   |
| Grafana | WebView/iframe | No public API for dashboards |

## CI/CD Notes

- `ci.yml` — lint, typecheck, format on every push/PR
- `android-build.yml` — manual dispatch, outputs AAB or APK
- `ios-build.yml` — manual dispatch, `macos-15`, ad-hoc or app-store distribution
- Fastlane used **only** for TestFlight upload in CI (`fastlane beta`)
- ExportOptions.plist is generated **inline** in the iOS workflow — do not create `ios/ExportOptions.plist`

## Secrets (GitHub)

See `docs/ci-cd-setup.md` for the full list of required secrets for Android and iOS signing.

## Key Files

- `docs/architecture.md` — system diagram and routing
- `docs/auth-flow.md` — PKCE flow, token lifecycle
- `docs/adding-a-new-feature.md` — step-by-step feature guide
- `docs/keycloak-token-audience-configuration.md` — Keycloak setup
