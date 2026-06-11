import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { AxiosInstance } from "axios";
import type { OonAuthConfig, OonUser } from "../types";
import { captureTokenFromUrl, type TokenStorage } from "./tokenStorage";

interface AuthContextValue {
  user: OonUser | null;
  roles: string[];
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  hasPermission: (permission?: string | string[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  http: AxiosInstance;
  storage: TokenStorage;
  auth?: OonAuthConfig;
  /** URL externa de login (Meus Apps) para redirecionar quando sem sessão. */
  loginUrl?: string;
  children: ReactNode;
}

/**
 * Provider de autenticação do Core. Fluxo (Seção 2.4 do back / 6.2 da doc):
 *  1. captura token do ?code= e guarda no tokenStorage;
 *  2. valida em GET /auth/validar-token e resolve `usuario`;
 *  3. sem token/ inválido => redireciona para o login externo.
 *
 * Backend continua sendo a autoridade final — o RBAC do front é só UX.
 */
export function AuthProvider({ http, storage, auth, loginUrl, children }: AuthProviderProps) {
  const tokenParam = auth?.tokenParam ?? "code";
  const [user, setUser] = useState<OonUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const redirectToLogin = useCallback(() => {
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      setStatus("unauthenticated");
    }
  }, [loginUrl]);

  const logout = useCallback(() => {
    storage.clear();
    setUser(null);
    redirectToLogin();
  }, [storage, redirectToLogin]);

  useEffect(() => {
    let active = true;

    const incoming = captureTokenFromUrl(tokenParam);
    if (incoming) storage.set(incoming);

    const token = storage.get();
    if (!token) {
      redirectToLogin();
      return;
    }

    http
      .get<{ usuario: OonUser }>("/auth/validar-token")
      .then((res) => {
        if (!active) return;
        setUser(res.data.usuario);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        storage.clear();
        redirectToLogin();
      });

    return () => {
      active = false;
    };
  }, [http, storage, tokenParam, redirectToLogin]);

  const roles = user?.tipo ? [user.tipo] : [];

  const hasPermission = useCallback(
    (permission?: string | string[]) => {
      if (!permission) return true;
      const required = Array.isArray(permission) ? permission : [permission];
      if (required.length === 0) return true;
      // admin/master sempre passa; demais checam interseção simples por papel.
      if (roles.includes("admin") || roles.includes("master")) return true;
      return required.some((p) => roles.includes(p) || roles.some((r) => p.startsWith(`${r}.`)));
    },
    [roles]
  );

  const value: AuthContextValue = {
    user,
    roles,
    status,
    isAuthenticated: status === "authenticated",
    hasPermission,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useOonAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useOonAuth deve ser usado dentro de <AuthProvider> (oonCoreFront.start).");
  return ctx;
}
