import type { ReactNode } from "react";

/* ------------------------------------------------------------------ *
 * Contrato de metadata do back (/core/*).
 * Espelha o que o @oondemand/oon-core-back expõe em src/api/core.routes.js.
 * ------------------------------------------------------------------ */

/** Tipos de campo emitidos pelo `fields` do back (Seção 2.4). */
export type FieldKind =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "ref"
  | "enum"
  | "currency"
  | "currencyCode"
  | "currencyConverted"
  | "raw";

/** Metadata de um campo de model, vinda de `metaFields` no back. */
export interface FieldMeta {
  name: string;
  kind: FieldKind;
  label?: string;
  searchable?: boolean;
  required?: boolean;
  /** model referenciada quando kind === "ref". */
  ref?: string;
  /** valores possíveis quando kind === "enum". */
  options?: string[];
  /** moeda base quando kind === "currencyConverted". */
  base?: string;
}

/** Resumo de uma model (resposta de /core/models e /core/models/:name). */
export interface ModelSummary {
  name: string;
  singular: string;
  /** basePath em que o CRUD está montado no back (ex.: "/cotacoes"). */
  basePath: string;
  crud: boolean;
  roles: { read?: string[]; write?: string[] };
  fields: FieldMeta[];
  searchable: string[];
}

export interface MenuMeta {
  label: string;
  href?: string;
  icon?: string;
  section?: string;
  order?: number;
  permissions?: string[];
}

/** Resposta completa de GET /core/metadata. */
export interface CoreMetadata {
  service: { name: string; version: string };
  models: ModelSummary[];
  collections: unknown[];
  documents: unknown[];
  pipelines: unknown[];
  integrations: unknown[];
  features: unknown[];
  menus: MenuMeta[];
}

/* ------------------------------------------------------------------ *
 * Contrato REST do CRUD (factories do back).
 * ------------------------------------------------------------------ */

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResult<T = Record<string, unknown>> {
  results: T[];
  pagination: Pagination;
}

export interface ListParams {
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  /** ex.: "nome.asc" | "criadoEm.desc" */
  sort?: string;
  /** filtros adicionais viram query string. */
  [filter: string]: unknown;
}

/** Erro normalizado (errorNormalizer). */
export interface OonError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
  requestId?: string;
}

/** Origem de auditoria enviada nos headers x-oon-* das mutações. */
export type AuditOrigin =
  | "datagrid"
  | "form"
  | "workflow"
  | "assistant"
  | "import"
  | "integration";

export interface AuditContext {
  origem?: AuditOrigin;
  module?: string;
  entity?: string;
}

/* ------------------------------------------------------------------ *
 * Usuário autenticado (resposta de /auth/validar-token).
 * ------------------------------------------------------------------ */

export interface OonUser {
  tipo: string;
  nome: string;
  email: string;
  [extra: string]: unknown;
}

/* ------------------------------------------------------------------ *
 * Config de bootstrap — oonCoreFront.start(config).
 * ------------------------------------------------------------------ */

export interface OonAppConfig {
  id: string;
  name: string;
  title?: string;
  logo?: string;
  favicon?: string;
  version?: string;
}

export interface OonApiConfig {
  baseUrl: string;
  assistantBaseUrl?: string;
  meusAppsUrl?: string;
  /** Prefixo de versão concatenado às chamadas. Default: "". */
  versionPrefix?: string;
  timeout?: number;
}

export interface OonAuthConfig {
  mode?: "bearer" | "cookie" | "external-sso";
  /** URL de login externo (Meus Apps) para redirect quando sem token. */
  loginUrl?: string;
  /** Nome do query param que carrega o token na volta do SSO. Default: "code". */
  tokenParam?: string;
}

export interface OonSecurityConfig {
  enableRouteGuard?: boolean;
  enablePermissionGate?: boolean;
  redactAssistantContext?: boolean;
  disableConsoleInProduction?: boolean;
}

export interface OonCoreFrontConfig {
  app: OonAppConfig;
  api: OonApiConfig;
  auth?: OonAuthConfig;
  theme?: Record<string, unknown>;
  modules?: OonModule[];
  /**
   * Declaração de UI no estilo `central.ui.json` (Seção 9). Atalho para
   * registrar coleções/documentos/esteiras sem escrever um módulo inteiro.
   */
  ui?: OonUiManifest;
  security?: OonSecurityConfig;
  /** Elemento DOM onde montar. Default: #root. */
  rootElementId?: string;
}

/* ------------------------------------------------------------------ *
 * Módulos, rotas e menu (registry).
 * ------------------------------------------------------------------ */

export interface OonRoute {
  path: string;
  element: ReactNode;
  /** rota pública não passa pelo RouteGuard. */
  public?: boolean;
  permissions?: string[];
}

export interface OonMenuItem {
  label: string;
  href: string;
  icon?: ReactNode;
  section?: string;
  order?: number;
  permissions?: string[];
}

export interface OonModule {
  id: string;
  label: string;
  version?: string;
  routes?: OonRoute[];
  menu?: OonMenuItem[];
  /** views declarativas que o Core transforma em rota + menu. */
  views?: OonViewDefinition[];
}

/* ------------------------------------------------------------------ *
 * Manifesto de UI declarativo (central.ui.json).
 * ------------------------------------------------------------------ */

export type CollectionMode = "full" | "minimal" | "dynamic";

export interface OonColumnDef {
  field: string;
  label?: string;
  /** kind sobrescreve o inferido da metadata. */
  kind?: FieldKind;
  sortable?: boolean;
  width?: number;
}

export interface OonFormFieldDef {
  field: string;
  label?: string;
  kind?: FieldKind;
  required?: boolean;
  options?: string[];
  /** model relacionada quando kind === "ref". */
  ref?: string;
}

/** Definição de uma coleção nas três formas da Seção 4.4. */
export interface CollectionViewDef {
  type: "collection";
  /** id de rota/menu; default = model em minúsculas. */
  id?: string;
  model: string;
  label?: string;
  path?: string;
  icon?: ReactNode;
  section?: string;
  /** "dynamic" monta tudo a partir de /core/models/:model. */
  mode?: CollectionMode;
  /** modo "full": colunas explícitas. */
  columns?: OonColumnDef[];
  /** modo "full": campos de formulário explícitos. */
  form?: OonFormFieldDef[];
  importExport?: boolean;
  permissions?: string[];
}

export interface DocumentViewDef {
  type: "document";
  id?: string;
  model: string;
  label?: string;
  path?: string;
  icon?: ReactNode;
  section?: string;
  approval?: boolean;
  attachments?: boolean;
  permissions?: string[];
}

export interface PipelineViewDef {
  type: "pipeline";
  id?: string;
  /** model dos cards (tickets). */
  model: string;
  label?: string;
  path?: string;
  icon?: ReactNode;
  section?: string;
  /** campo do registro que define a etapa/coluna. */
  stageField?: string;
  /** etapas fixas; se omitido, derivadas do enum de stageField. */
  stages?: Array<{ id: string; label: string }>;
  permissions?: string[];
}

export interface DashboardViewDef {
  type: "dashboard";
  id?: string;
  label?: string;
  path?: string;
  icon?: ReactNode;
  section?: string;
  widgets?: DashboardWidgetDef[];
}

export interface DashboardWidgetDef {
  id: string;
  label: string;
  /** model de onde puxar a contagem/agregação. */
  model?: string;
  kind?: "count" | "sum" | "custom";
  /** campo somado quando kind === "sum". */
  field?: string;
  render?: () => ReactNode;
}

export type OonViewDefinition =
  | CollectionViewDef
  | DocumentViewDef
  | PipelineViewDef
  | DashboardViewDef;

export interface OonUiManifest {
  views: OonViewDefinition[];
}
