/**
 * @oondemand/oon-core-front — API pública (Fase 3, Seção 4.3).
 *
 * Uma Central consome só isto: chama `start(config)` no main.tsx e declara
 * suas telas com `define*View` / componentes `Core*`. Todo o resto (shell,
 * providers, roteamento, auth, RBAC, SDK REST do /core/*) vive aqui dentro.
 */

// Bootstrap
export { start, oonCoreFront } from "./start";
export { startFromManifest, manifestToConfig } from "./manifest";
export type { CentralUiManifest, ManifestRuntime } from "./manifest";

// Declaração de views/módulos
export {
  defineCollectionView,
  defineDocumentView,
  definePipelineView,
  defineDashboard,
  defineOonModule,
} from "./define/views";

// Componentes Core
export { CoreCollection } from "./components/CoreCollection";
export { CoreDocument } from "./components/CoreDocument";
export { CorePipeline } from "./components/CorePipeline";
export { CoreIntegration } from "./components/CoreIntegration";
export { CoreCurrency } from "./components/CoreCurrency";
export { CoreAssistant } from "./components/CoreAssistant";
export { CoreDashboard } from "./components/CoreDashboard";

// Segurança / hooks expostos para o domínio
export { useOonAuth } from "./security/AuthProvider";
export { PermissionGate } from "./security/PermissionGate";
export { useOonApi, useOonResource, useCoreMetadata, useModelSchema } from "./api/ApiProvider";

// Tipos do contrato público
export type {
  OonCoreFrontConfig,
  OonAppConfig,
  OonApiConfig,
  OonAuthConfig,
  OonSecurityConfig,
  OonModule,
  OonRoute,
  OonMenuItem,
  OonUiManifest,
  OonViewDefinition,
  CollectionViewDef,
  DocumentViewDef,
  PipelineViewDef,
  DashboardViewDef,
  DashboardWidgetDef,
  CollectionMode,
  OonColumnDef,
  OonFormFieldDef,
  CoreMetadata,
  ModelSummary,
  FieldMeta,
  FieldKind,
  PaginatedResult,
  Pagination,
  ListParams,
  OonError,
  OonUser,
} from "./types";
