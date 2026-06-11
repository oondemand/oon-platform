import { createBrowserRouter, type RouteObject } from "react-router-dom";
import type { OonAppConfig, OonMenuItem, OonRoute, OonSecurityConfig } from "../types";
import { AuthenticatedLayout } from "../shell/AuthenticatedLayout";
import { RouteGuard } from "../security/RouteGuard";

export interface RouterInput {
  app: OonAppConfig;
  menu: OonMenuItem[];
  routes: OonRoute[];
  security?: OonSecurityConfig;
}

/**
 * Constrói o router a partir do registry resolvido (rotas dos módulos/views).
 * Rotas privadas ficam sob o layout autenticado e passam pelo RouteGuard;
 * rotas `public: true` ficam fora do layout.
 */
export function createOonRouter({ app, menu, routes, security }: RouterInput) {
  const guardEnabled = security?.enableRouteGuard !== false;

  const publicRoutes: RouteObject[] = routes
    .filter((r) => r.public)
    .map((r) => ({ path: r.path, element: r.element }));

  const privateRoutes: RouteObject[] = routes
    .filter((r) => !r.public)
    .map((r) => {
      const element = guardEnabled ? <RouteGuard permission={r.permissions}>{r.element}</RouteGuard> : r.element;
      // Rota raiz vira index route; demais usam path relativo ao layout.
      return r.path === "/" ? { index: true, element } : { path: r.path.replace(/^\//, ""), element };
    });

  const tree: RouteObject[] = [
    ...publicRoutes,
    {
      path: "/",
      element: <AuthenticatedLayout app={app} menu={menu} />,
      children: privateRoutes,
    },
  ];

  return createBrowserRouter(tree);
}
