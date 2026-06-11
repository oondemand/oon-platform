/**
 * Armazenamento de token encapsulado (Seção 6.2). Toda leitura/escrita de
 * token passa por aqui — nada de `localStorage.getItem('token')` espalhado.
 * Tudo com try/catch para JSON/localStorage inválido não derrubar a tela.
 */
const STORAGE_KEY = "oon.auth.token";

export interface TokenStorage {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export function createTokenStorage(namespace?: string): TokenStorage {
  const key = namespace ? `${STORAGE_KEY}.${namespace}` : STORAGE_KEY;

  return {
    get() {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(token: string) {
      try {
        window.localStorage.setItem(key, token);
      } catch {
        /* storage indisponível (modo privado) — ignora silenciosamente. */
      }
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* noop */
      }
    },
  };
}

/**
 * Lê o token vindo do SSO via query string (?code=...) e remove da URL para
 * não vazar em histórico/logs. Retorna o token capturado, se houver.
 */
export function captureTokenFromUrl(tokenParam = "code"): string | null {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(tokenParam);
    if (!token) return null;
    url.searchParams.delete(tokenParam);
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    return token;
  } catch {
    return null;
  }
}
