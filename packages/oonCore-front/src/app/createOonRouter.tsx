import { Navigate, createBrowserRouter, type RouteObject } from "react-router-dom";
import type { OonAppConfig, OonMenuItem, OonRoute, OonSecurityConfig } from "../types";
import { AuthenticatedLayout } from "../shell/AuthenticatedLayout";
import { AccessDeniedPage } from "../security/AccessDeniedPage";
import { AppAccessGuard } from "../security/AppAccessGuard";
import { LoginPage } from "../security/LoginPage";
import { RouteGuard } from "../security/RouteGuard";

export interface RouterInput {
  app: OonAppConfig;
  menu: OonMenuItem[];
  routes: OonRoute[];
  security?: OonSecurityConfig;
}

/** Constrói o router, incluindo os estados públicos de autenticação. */
export function createOonRouter({ app, menu, routes, security }: RouterInput) {
  const guardEnabled = security?.enableRouteGuard !== false;

  const publicRoutes: RouteObject[] = routes
    .filter((route) => route.public)
    .map((route) => ({ path: route.path, element: route.element }));

  const privateSource = routes.filter((route) => !route.public);
  const privateRoutes: RouteObject[] = privateSource.map((route) => {
    const element = guardEnabled ? (
      <RouteGuard permission={route.permissions}>{route.element}</RouteGuard>
    ) : (
      route.element
    );

    return route.path === "/"
      ? { index: true, element }
      : { path: route.path.replace(/^\//, ""), element };
  });

  const hasIndexRoute = privateSource.some((route) => route.path === "/");
  const firstRoute = privateSource.find((route) => route.path !== "/");
  if (!hasIndexRoute && firstRoute) {
    privateRoutes.unshift({
      index: true,
      element: <Navigate to={firstRoute.path} replace />,
    });
  }

  const customPaths = new Set(publicRoutes.map((route) => route.path));
  const builtInPublicRoutes: RouteObject[] = [];

  if (!customPaths.has("/login")) {
    builtInPublicRoutes.push({ path: "/login", element: <LoginPage app={app} /> });
  }

  if (!customPaths.has("/acesso-negado")) {
    builtInPublicRoutes.push({
      path: "/acesso-negado",
      element: <AccessDeniedPage app={app} />,
    });
  }

  const tree: RouteObject[] = [
    ...builtInPublicRoutes,
    ...publicRoutes,
    {
      path: "/",
      element: (
        <AppAccessGuard>
          <AuthenticatedLayout app={app} menu={menu} />
        </AppAccessGuard>
      ),
      children: privateRoutes,
    },
  ];

  return createBrowserRouter(tree);
}
