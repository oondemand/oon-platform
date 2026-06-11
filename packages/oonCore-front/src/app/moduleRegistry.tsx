import type {
  CollectionViewDef,
  DashboardViewDef,
  DocumentViewDef,
  OonCoreFrontConfig,
  OonMenuItem,
  OonRoute,
  OonViewDefinition,
  PipelineViewDef,
} from "../types";
import { CoreCollection } from "../components/CoreCollection";
import { CoreDocument } from "../components/CoreDocument";
import { CorePipeline } from "../components/CorePipeline";
import { CoreDashboard } from "../components/CoreDashboard";

/** Resultado da resolução de módulos + manifesto de UI em rotas e menu. */
export interface ResolvedRegistry {
  routes: OonRoute[];
  menu: OonMenuItem[];
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function viewId(view: OonViewDefinition): string {
  if (view.id) return view.id;
  if (view.type === "dashboard") return "dashboard";
  return slug(view.model);
}

function viewPath(view: OonViewDefinition): string {
  if (view.path) return view.path;
  if (view.type === "dashboard") return "/";
  return `/${viewId(view)}`;
}

function viewLabel(view: OonViewDefinition): string {
  if (view.label) return view.label;
  if (view.type === "dashboard") return "Dashboard";
  return view.model;
}

/** Converte uma view declarativa no componente Core correspondente. */
function renderView(view: OonViewDefinition) {
  switch (view.type) {
    case "collection": {
      const v = view as CollectionViewDef;
      return (
        <CoreCollection
          model={v.model}
          mode={v.mode}
          columns={v.columns}
          form={v.form}
          label={viewLabel(v)}
          importExport={v.importExport}
        />
      );
    }
    case "document": {
      const v = view as DocumentViewDef;
      return <CoreDocument model={v.model} label={viewLabel(v)} approval={v.approval} attachments={v.attachments} />;
    }
    case "pipeline": {
      const v = view as PipelineViewDef;
      return (
        <CorePipeline
          model={v.model}
          label={viewLabel(v)}
          stageField={v.stageField}
          stages={v.stages}
        />
      );
    }
    case "dashboard": {
      const v = view as DashboardViewDef;
      return <CoreDashboard label={viewLabel(v)} widgets={v.widgets} />;
    }
    default:
      return null;
  }
}

function viewToRoute(view: OonViewDefinition): OonRoute {
  return {
    path: viewPath(view),
    element: renderView(view),
    permissions: "permissions" in view ? view.permissions : undefined,
  };
}

function viewToMenu(view: OonViewDefinition): OonMenuItem {
  return {
    label: viewLabel(view),
    href: viewPath(view),
    icon: view.icon,
    section: view.section,
    permissions: "permissions" in view ? view.permissions : undefined,
  };
}

/**
 * Resolve a config inteira (módulos + `ui.views`) em um registry plano de
 * rotas e menu. É o que substitui o `router.jsx` hardcoded por geração
 * dirigida por declaração/metadata.
 */
export function resolveRegistry(config: OonCoreFrontConfig): ResolvedRegistry {
  const routes: OonRoute[] = [];
  const menu: OonMenuItem[] = [];
  const seenPaths = new Set<string>();

  const pushRoute = (route: OonRoute) => {
    if (seenPaths.has(route.path)) return;
    seenPaths.add(route.path);
    routes.push(route);
  };

  for (const mod of config.modules ?? []) {
    for (const route of mod.routes ?? []) pushRoute(route);
    for (const item of mod.menu ?? []) menu.push(item);
    for (const view of mod.views ?? []) {
      pushRoute(viewToRoute(view));
      menu.push(viewToMenu(view));
    }
  }

  for (const view of config.ui?.views ?? []) {
    pushRoute(viewToRoute(view));
    menu.push(viewToMenu(view));
  }

  menu.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  return { routes, menu };
}
