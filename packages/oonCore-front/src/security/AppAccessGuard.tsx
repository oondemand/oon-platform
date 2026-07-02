import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "../shell/LoadingScreen";
import { useOonAuth } from "./AuthProvider";

function loginRedirect(pathname: string, search: string): string {
  const destination = `${pathname}${search}`;
  return `/login?redirect=${encodeURIComponent(destination)}`;
}

/**
 * Guarda a aplicação inteira depois que o backend valida token e permissão do
 * app. 401 segue para login; 403 segue para a página de acesso negado.
 */
export function AppAccessGuard({ children }: { children: ReactNode }) {
  const { status, retry } = useOonAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={loginRedirect(location.pathname, location.search)}
        replace
      />
    );
  }

  if (status === "forbidden") {
    return <Navigate to="/acesso-negado" replace />;
  }

  if (status === "error") {
    return (
      <LoadingScreen
        message="Não foi possível validar seu acesso. Tente novamente."
        actionLabel="Tentar novamente"
        onAction={() => void retry()}
      />
    );
  }

  return <>{children}</>;
}
