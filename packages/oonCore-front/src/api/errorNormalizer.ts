import axios from "axios";
import type { OonError } from "../types";

/**
 * Normaliza qualquer erro de rede/axios para o formato `OonError`, lendo o
 * envelope de erro padrão do back (`{ message }` ou `{ error: {...} }`).
 */
export function normalizeError(err: unknown): OonError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { message?: string; error?: { code?: string; message?: string; details?: unknown; requestId?: string } }
      | undefined;

    const envelope = data?.error;
    return {
      code: envelope?.code || codeFromStatus(status),
      message: envelope?.message || data?.message || err.message || "Erro inesperado.",
      status,
      details: envelope?.details,
      requestId: envelope?.requestId || (err.response?.headers?.["x-request-id"] as string | undefined),
    };
  }

  if (err instanceof Error) {
    return { code: "UNKNOWN", message: err.message };
  }

  return { code: "UNKNOWN", message: "Erro inesperado." };
}

function codeFromStatus(status?: number): string {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    default:
      return status && status >= 500 ? "SERVER_ERROR" : "REQUEST_ERROR";
  }
}
