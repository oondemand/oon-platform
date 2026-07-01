import { Navigate, createBrowserRouter, type RouteObject } from "react-router-dom";
import type { OonAppConfig, OonMenuItem, OonRoute, OonSecurityConfig } from "../types";
import { AuthenticatedLayout } from "../shell/AuthenticatedLayout";
import { RouteGuard } from "../security/RouteGuard";

export interface RouterInput {
  app: OonAppConfig;
  menu: OonMenuItem[];
  routes: OonRoute[];
  security?: OonSecurityConfig;
}

/** Constrói o router e garante uma entrada válida mesmo sem dashboard explícito. */
export function createOonRouter({ app, menu, routes, security }: RouterInput) {
  const guardEnabled = security?.enableRouteGuard !== false;

  const publicRoutes: RouteObject[] = routes
    .filter((r) => r.public)
    .map((r) => ({ path: r.path, element: r.element }));

  const privateSource = routes.filter((r) => !r.public);
  const privateRoutes: RouteObject[] = privateSource.map((r) => {
    const element = guardEnabled ? <RouteGuard permission={r.permissions}>{r.element}</RouteGuard> : r.element;
    return r.path === "/" ? { index: true, element } : { path: r.path.replace(/^\//, ""), element };
  });

  const hasIndexRoute = privateSource.some((route) => route.path === "/");
  const firstRoute = privateSource.find((route) => route.path !== "/");
  if (!hasIndexRoute && firstRoute) {
    privateRoutes.unshift({ index: true, element: <Navigate to={firstRoute.path} replace /> });
  }

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
