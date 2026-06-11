import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import type { OonCoreFrontConfig } from "../types";
import { createRestClient } from "../api/createRestClient";
import { createTokenStorage } from "../security/tokenStorage";
import { OonProviders } from "./OonProviders";
import { resolveRegistry } from "./moduleRegistry";
import { createOonRouter } from "./createOonRouter";

/**
 * Raiz da aplicação Core. Cria o cliente REST (com token storage + 401),
 * resolve o registry de rotas/menu e monta providers + router.
 */
export function OonApp({ config }: { config: OonCoreFrontConfig }) {
  const { http, storage, router } = useMemo(() => {
    const storage = createTokenStorage(config.app.id);
    const loginUrl = config.auth?.loginUrl ?? config.api.meusAppsUrl;

    const http = createRestClient({
      api: config.api,
      appId: config.app.id,
      getToken: () => storage.get(),
      onUnauthorized: () => {
        storage.clear();
        if (loginUrl) window.location.href = loginUrl;
      },
    });

    const { routes, menu } = resolveRegistry(config);
    const router = createOonRouter({ app: config.app, menu, routes, security: config.security });

    return { http, storage, router };
  }, [config]);

  return (
    <OonProviders config={config} http={http} storage={storage}>
      <RouterProvider router={router} />
    </OonProviders>
  );
}
