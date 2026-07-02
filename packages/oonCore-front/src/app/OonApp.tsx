import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import type { OonCoreFrontConfig } from "../types";
import { createRestClient } from "../api/createRestClient";
import { createTokenStorage } from "../security/tokenStorage";
import { OonProviders } from "./OonProviders";
import { resolveRegistry } from "./moduleRegistry";
import { createOonRouter } from "./createOonRouter";

function localLoginUrl(): string {
  const current = `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(current)}`;
}

/**
 * Raiz da aplicação Core. Cria o cliente REST, resolve rotas/menu e monta os
 * providers. Respostas 401 seguem para o login; 403 é tratado pelo AuthProvider.
 */
export function OonApp({ config }: { config: OonCoreFrontConfig }) {
  const { http, storage, router } = useMemo(() => {
    const storage = createTokenStorage(config.app.id);
    const externalLoginUrl = config.auth?.loginUrl ?? config.api.meusAppsUrl;

    const http = createRestClient({
      api: config.api,
      appId: config.app.id,
      getToken: () => storage.get(),
      onUnauthorized: () => {
        storage.clear();

        if (externalLoginUrl) {
          window.location.href = externalLoginUrl;
          return;
        }

        if (window.location.pathname !== "/login") {
          window.location.href = localLoginUrl();
        }
      },
    });

    const { routes, menu } = resolveRegistry(config);
    const router = createOonRouter({
      app: config.app,
      menu,
      routes,
      security: config.security,
    });

    return { http, storage, router };
  }, [config]);

  return (
    <OonProviders config={config} http={http} storage={storage}>
      <RouterProvider router={router} />
    </OonProviders>
  );
}
