import type {
  CollectionMode,
  CollectionViewDef,
  DocumentViewDef,
  OonCoreFrontConfig,
  OonViewDefinition,
  PipelineViewDef,
} from "./types";
import { start } from "./start";

/**
 * Schema do `central.ui.json` (Seção 9 do escopo). É o que o frontend
 * consumidor gerado pelo `create-central-oon` carrega — declaração pura, sem
 * código de UI. O Core converte isto em `OonCoreFrontConfig`.
 */
export interface CentralUiManifest {
  name: string;
  slug: string;
  backend?: { metadataUrl?: string };
  navigation?: { mode?: "auto" | "manual" };
  collections?: Array<{
    model: string;
    mode?: CollectionMode;
    path?: string;
    label?: string;
    section?: string;
  }>;
  pipelines?: Array<{
    name?: string;
    model?: string;
    mode?: string;
    stageField?: string;
    path?: string;
    label?: string;
    section?: string;
  }>;
  documents?: Array<{
    model: string;
    mode?: string;
    path?: string;
    label?: string;
    section?: string;
    approval?: boolean;
    attachments?: boolean;
  }>;
}

/** Dados de runtime que o `central.ui.json` não carrega (vêm do .env). */
export interface ManifestRuntime {
  apiBaseUrl: string;
  meusAppsUrl?: string;
  assistantBaseUrl?: string;
  versionPrefix?: string;
}

/** Converte o manifesto declarativo + runtime em config do Core. */
export function manifestToConfig(manifest: CentralUiManifest, runtime: ManifestRuntime): OonCoreFrontConfig {
  const views: OonViewDefinition[] = [];

  for (const c of manifest.collections ?? []) {
    const view: CollectionViewDef = {
      type: "collection",
      model: c.model,
      mode: c.mode ?? "dynamic",
      path: c.path,
      label: c.label,
      section: c.section,
    };
    views.push(view);
  }

  for (const p of manifest.pipelines ?? []) {
    const model = p.model ?? p.name;
    if (!model) continue;
    const view: PipelineViewDef = {
      type: "pipeline",
      model,
      label: p.label ?? p.name,
      path: p.path,
      stageField: p.stageField,
      section: p.section,
    };
    views.push(view);
  }

  for (const d of manifest.documents ?? []) {
    const view: DocumentViewDef = {
      type: "document",
      model: d.model,
      label: d.label,
      path: d.path,
      section: d.section,
      approval: d.approval,
      attachments: d.attachments,
    };
    views.push(view);
  }

  return {
    app: {
      id: manifest.slug,
      name: manifest.name,
      title: manifest.name,
    },
    api: {
      baseUrl: runtime.apiBaseUrl,
      meusAppsUrl: runtime.meusAppsUrl,
      assistantBaseUrl: runtime.assistantBaseUrl,
      versionPrefix: runtime.versionPrefix ?? "",
    },
    auth: { mode: "bearer", tokenParam: "code" },
    security: {
      enableRouteGuard: true,
      enablePermissionGate: true,
      redactAssistantContext: true,
      disableConsoleInProduction: true,
    },
    ui: { views },
  };
}

/**
 * Bootstrap a partir do `central.ui.json`. É a única linha que o `main.tsx` de
 * uma Central gerada precisa:
 *
 *   import manifest from "../central.ui.json";
 *   startFromManifest(manifest, { apiBaseUrl: import.meta.env.VITE_API_URL });
 */
export function startFromManifest(manifest: CentralUiManifest, runtime: ManifestRuntime) {
  start(manifestToConfig(manifest, runtime));
}
