import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AxiosInstance } from "axios";
import type { OonAuthConfig, OonError, OonUser } from "../types";
import { captureTokenFromUrl, type TokenStorage } from "./tokenStorage";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "forbidden"
  | "error";

interface AuthContextValue {
  user: OonUser | null;
  roles: string[];
  status: AuthStatus;
  isAuthenticated: boolean;
  hasPermission: (permission?: string | string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  retry: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  http: AxiosInstance;
  storage: TokenStorage;
  auth?: OonAuthConfig;
  /** URL externa opcional. Sem ela, o Core usa a tela local em /login. */
  loginUrl?: string;
  children: ReactNode;
}

function errorStatus(error: unknown): number | undefined {
  return (error as OonError | undefined)?.status;
}

function encodeBasicCredentials(email: string, password: string): string {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

/**
 * Provider de autenticação do Core:
 *  1. captura token do ?code=, token de desenvolvimento ou storage;
 *  2. valida o token e a permissão do app em GET /auth/validar-token;
 *  3. trata 401 como ausência de sessão e 403 como acesso negado;
 *  4. oferece login local via POST /auth/autenticar.
 */
export function AuthProvider({
  http,
  storage,
  auth,
  loginUrl,
  children,
}: AuthProviderProps) {
  const tokenParam = auth?.tokenParam ?? "code";
  const devToken = auth?.devToken?.trim() || null;
  const [user, setUser] = useState<OonUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const redirectToExternalLogin = useCallback(() => {
    if (loginUrl) window.location.href = loginUrl;
  }, [loginUrl]);

  const applyValidationError = useCallback(
    (error: unknown) => {
      const currentStatus = errorStatus(error);
      setUser(null);

      if (currentStatus === 403) {
        setStatus("forbidden");
        return;
      }

      if (currentStatus === 401) {
        storage.clear();
        setStatus("unauthenticated");
        redirectToExternalLogin();
        return;
      }

      setStatus("error");
    },
    [storage, redirectToExternalLogin],
  );

  const validateSession = useCallback(async () => {
    const response = await http.get<{ usuario: OonUser }>(
      "/auth/validar-token",
    );
    setUser(response.data.usuario);
    setStatus("authenticated");
  }, [http]);

  const retry = useCallback(async () => {
    setStatus("loading");
    try {
      await validateSession();
    } catch (error) {
      applyValidationError(error);
      throw error;
    }
  }, [validateSession, applyValidationError]);

  const login = useCallback(
    async (email: string, password: string) => {
      setStatus("loading");
      setUser(null);

      try {
        const response = await http.post<{ token: string }>(
          "/auth/autenticar",
          {},
          {
            headers: {
              Authorization: `Basic ${encodeBasicCredentials(email, password)}`,
            },
          },
        );

        if (!response.data.token) {
          const error: OonError = {
            code: "AUTH_TOKEN_MISSING",
            message: "Token não retornado pelo backend.",
            status: 502,
          };
          throw error;
        }

        storage.set(response.data.token);
        await validateSession();
      } catch (error) {
        applyValidationError(error);
        throw error;
      }
    },
    [http, storage, validateSession, applyValidationError],
  );

  const logout = useCallback(() => {
    storage.clear();
    setUser(null);
    setStatus("unauthenticated");
    redirectToExternalLogin();
  }, [storage, redirectToExternalLogin]);

  useEffect(() => {
    let active = true;

    const incoming = captureTokenFromUrl(tokenParam);
    const stored = storage.get();
    const token = incoming ?? devToken ?? stored;

    if (token && token !== stored) storage.set(token);

    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      redirectToExternalLogin();
      return;
    }

    setStatus("loading");
    http
      .get<{ usuario: OonUser }>("/auth/validar-token")
      .then((response) => {
        if (!active) return;
        setUser(response.data.usuario);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        applyValidationError(error);
      });

    return () => {
      active = false;
    };
  }, [
    http,
    storage,
    tokenParam,
    devToken,
    redirectToExternalLogin,
    applyValidationError,
  ]);

  const roles = user?.tipo ? [user.tipo] : [];

  const hasPermission = useCallback(
    (permission?: string | string[]) => {
      if (!permission) return true;
      const required = Array.isArray(permission) ? permission : [permission];
      if (required.length === 0) return true;
      if (roles.includes("admin") || roles.includes("master")) return true;
      return required.some(
        (value) =>
          roles.includes(value) ||
          roles.some((role) => value.startsWith(`${role}.`)),
      );
    },
    [roles],
  );

  const value: AuthContextValue = {
    user,
    roles,
    status,
    isAuthenticated: status === "authenticated",
    hasPermission,
    login,
    retry,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useOonAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useOonAuth deve ser usado dentro de <AuthProvider> (oonCoreFront.start).",
    );
  }
  return context;
}
