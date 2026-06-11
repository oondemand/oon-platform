import type { AxiosInstance } from "axios";
import type { AuditContext, ListParams, PaginatedResult } from "../types";
import { auditHeaders } from "./createRestClient";

/**
 * SDK por recurso (Seção 2.5). Espelha o CRUD gerado pelo back em `basePath`:
 *   GET /            -> list (paginado)
 *   GET /:id         -> get
 *   POST /           -> create
 *   PUT /:id         -> update
 *   PATCH /:id       -> patch
 *   DELETE /:id      -> delete
 *   POST /import     -> importMany
 *   GET /export      -> exportAll
 *
 * O back devolve registro único na chave do singular (`{ [singular]: {...} }`);
 * `unwrap` extrai o primeiro valor não-meta para o consumidor não precisar
 * conhecer o singular.
 */
export interface ResourceClient<T = Record<string, unknown>> {
  list(params?: ListParams): Promise<PaginatedResult<T>>;
  get(id: string): Promise<T>;
  create(body: Partial<T>, audit?: AuditContext): Promise<T>;
  update(id: string, body: Partial<T>, audit?: AuditContext): Promise<T>;
  patch(id: string, body: Partial<T>, audit?: AuditContext): Promise<T>;
  delete(id: string, audit?: AuditContext): Promise<T>;
  importMany(rows: unknown[], audit?: AuditContext): Promise<{ inserted?: number; [k: string]: unknown }>;
  exportAll(params?: ListParams): Promise<T[]>;
}

const META_KEYS = new Set(["pagination", "results", "message", "requestId"]);

function unwrap<T>(data: Record<string, unknown>): T {
  // resposta tipo { pessoa: {...} } — pega o primeiro valor de objeto.
  for (const [key, value] of Object.entries(data)) {
    if (!META_KEYS.has(key) && value && typeof value === "object") {
      return value as T;
    }
  }
  return data as T;
}

export function createResourceClient<T = Record<string, unknown>>(
  http: AxiosInstance,
  basePath: string
): ResourceClient<T> {
  const base = `/${basePath.replace(/^\/+/, "")}`;

  return {
    async list(params) {
      const { data } = await http.get<PaginatedResult<T>>(base, { params });
      return data;
    },
    async get(id) {
      const { data } = await http.get<Record<string, unknown>>(`${base}/${id}`);
      return unwrap<T>(data);
    },
    async create(body, audit) {
      const { data } = await http.post<Record<string, unknown>>(base, body, {
        headers: auditHeaders(audit ?? { origem: "form" }),
      });
      return unwrap<T>(data);
    },
    async update(id, body, audit) {
      const { data } = await http.put<Record<string, unknown>>(`${base}/${id}`, body, {
        headers: auditHeaders(audit ?? { origem: "form" }),
      });
      return unwrap<T>(data);
    },
    async patch(id, body, audit) {
      const { data } = await http.patch<Record<string, unknown>>(`${base}/${id}`, body, {
        headers: auditHeaders(audit ?? { origem: "datagrid" }),
      });
      return unwrap<T>(data);
    },
    async delete(id, audit) {
      const { data } = await http.delete<Record<string, unknown>>(`${base}/${id}`, {
        headers: auditHeaders(audit ?? { origem: "datagrid" }),
      });
      return unwrap<T>(data);
    },
    async importMany(rows, audit) {
      const { data } = await http.post<{ inserted?: number }>(
        `${base}/import`,
        { rows },
        { headers: auditHeaders(audit ?? { origem: "import" }) }
      );
      return data;
    },
    async exportAll(params) {
      const { data } = await http.get<{ results: T[] } | T[]>(`${base}/export`, { params });
      return Array.isArray(data) ? data : data.results;
    },
  };
}
