export type AppConfig = {
  keycloakUrl: string; // e.g. https://keycloak.home.example.com
  realm: string; // e.g. home
  clientId: string; // e.g. homelab-portal
  argocdUrl: string; // e.g. https://argocd.home.example.com
  grafanaUrl: string; // e.g. https://grafana.home.example.com
};
