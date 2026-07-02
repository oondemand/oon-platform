import axios, { type AxiosInstance } from "axios";
import type { AuditContext, OonApiConfig } from "../types";
import { normalizeError } from "./errorNormalizer";

export interface RestClientDeps {
  api: OonApiConfig;
  /** Lê o token atual (Bearer). Retorna null se não autenticado. */
  getToken: () => string | null;
  /** Chamado uma vez ao receber 401 (logout + redirect). */
  onUnauthorized?: () => void;
  /** Origem app id, vai no header x-oon-app. */
  appId?: string;
}

/**
 * Cliente REST único do Core (Seção 2.5). Centraliza:
 *  - baseUrl + versionPrefix;
 *  - injeção de Bearer token;
 *  - headers de auditoria x-oon-* nas mutações;
 *  - tratamento global de 401 e normalização de erro.
 */
export function createRestClient(deps: RestClientDeps): AxiosInstance {
  const { api, getToken, onUnauthorized, appId } = deps;
  const prefix = api.versionPrefix ?? "";

  const instance = axios.create({
    baseURL: `${api.baseUrl.replace(/\/$/, "")}${prefix}`,
    timeout: api.timeout ?? 30000,
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (appId) config.headers["x-oon-app"] = appId;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const normalized = normalizeError(error);
      const requestPath = String(error.config?.url || "")
        .split("?")[0]
        .replace(/\/$/, "");
      const isLogin = requestPath.endsWith("/auth/autenticar");
      if (normalized.status === 401 && !isLogin) onUnauthorized?.();
      return Promise.reject(normalized);
    }
  );

  return instance;
}

/** Monta os headers de auditoria x-oon-* a partir do contexto. */
export function auditHeaders(audit?: AuditContext): Record<string, string> {
  if (!audit) return {};
  const headers: Record<string, string> = {};
  if (audit.origem) headers["x-oon-origin"] = audit.origem;
  if (audit.module) headers["x-oon-module"] = audit.module;
  if (audit.entity) headers["x-oon-entity"] = audit.entity;
  return headers;
}
