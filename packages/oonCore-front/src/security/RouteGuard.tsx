import type { ReactNode } from "react";
import { useOonAuth } from "./AuthProvider";
import { LoadingScreen } from "../shell/LoadingScreen";

/**
 * Protege rotas privadas: enquanto valida o token mostra loading; sem sessão
 * o AuthProvider já redireciona para o login externo, então aqui só seguramos
 * o render. `permission` opcional bloqueia por papel (UX; back valida de novo).
 */
export function RouteGuard({
  permission,
  children,
}: {
  permission?: string | string[];
  children: ReactNode;
}) {
  const { status, hasPermission } = useOonAuth();

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") return <LoadingScreen message="Redirecionando para o login..." />;
  if (!hasPermission(permission)) {
    return <LoadingScreen message="Você não tem acesso a esta tela." />;
  }
  return <>{children}</>;
}
