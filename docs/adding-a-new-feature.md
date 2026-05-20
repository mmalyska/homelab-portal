# Adding a New Feature

This guide walks through adding a new service integration to Homelab Portal.

## Overview

Each feature is a self-contained vertical slice. It owns its API client, hooks, components, and types. It may only import from `core/` — never from other features.

## Steps

### 1. Add URL to Config

`core/config/types.ts`:
```typescript
export type AppConfig = {
  // ... existing fields
  myServiceUrl: string;
};
```

`app/setup.tsx` — add to `FIELDS` array:
```typescript
{ label: 'My Service URL', key: 'myServiceUrl', placeholder: 'https://myservice.example.com' },
```

### 2. Create Feature Directory

```
features/myservice/
├── components/     ← UI components specific to this feature
├── api/
│   └── client.ts  ← REST client; reads token from AuthContext
├── hooks/
│   └── useMyData.ts ← React Query hooks
└── types/
    └── index.ts    ← API response types
```

### 3. Implement the API Client

`features/myservice/api/client.ts`:
```typescript
export function createMyServiceClient(baseUrl: string, accessToken: string) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  return {
    getData: (): Promise<MyData[]> =>
      fetch(`${baseUrl}/api/v1/data`, { headers }).then((r) => r.json()),
  };
}
```

### 4. Implement React Query Hooks

`features/myservice/hooks/useMyData.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../core/auth/AuthContext';
import { useConfig } from '../../../core/config/ConfigContext';
import { createMyServiceClient } from '../api/client';

export function useMyData() {
  const { accessToken } = useAuth();
  const { config } = useConfig();

  return useQuery({
    queryKey: ['myservice', 'data'],
    queryFn: () => {
      const client = createMyServiceClient(config!.myServiceUrl, accessToken!);
      return client.getData();
    },
    enabled: !!accessToken && !!config?.myServiceUrl,
  });
}
```

### 5. Add App Screen

`app/(app)/myservice.tsx`:
```typescript
import { useMyData } from '../../features/myservice/hooks/useMyData';

export default function MyServiceScreen() {
  const { data, isLoading, error } = useMyData();
  // render UI
}
```

### 6. Add to Main Menu

`app/(app)/index.tsx` — add to `FEATURES` array:
```typescript
{ id: 'myservice', label: 'My Service', emoji: '🔧', route: '/(app)/myservice' },
```

### 7. Configure Keycloak Audience (if using API)

In Keycloak Admin → Clients → `homelab-portal` → Mappers → Create:

| Field | Value |
|---|---|
| Mapper Type | Audience |
| Name | `myservice-audience` |
| Included Client Audience | `myservice` |
| Add to access token | ON |

See [Keycloak Token & Audience Configuration](./keycloak-token-audience-configuration.md) for full details.

## Embedded vs Native

If the service has no usable API, use embedded mode instead:

```typescript
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useConfig } from '../../../core/config/ConfigContext';

export function MyServiceEmbed() {
  const { config } = useConfig();
  if (Platform.OS === 'web') {
    return <iframe src={config?.myServiceUrl} style={{ flex: 1, border: 'none' }} />;
  }
  return <WebView source={{ uri: config?.myServiceUrl ?? '' }} style={{ flex: 1 }} />;
}
```

SSO session carries over automatically via the browser/WebView cookie store.

## Rules

- `features/X/` imports only from `core/` — never from `features/Y/`
- Query keys must be namespaced: `['myservice', ...]`
- All types live in `features/myservice/types/` — no shared types with other features
- API client is a plain factory function — no singletons, no global state
