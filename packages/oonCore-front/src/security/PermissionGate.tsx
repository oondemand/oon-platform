import type { ReactNode } from "react";
import { useOonAuth } from "./AuthProvider";

/**
 * Esconde a UI quando o usuário não tem a permissão. NÃO é segurança real
 * (Seção 6.2, item 3) — o back é a autoridade. Serve apenas para não exibir
 * ações/menus que o usuário não pode usar.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission?: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission } = useOonAuth();
  return <>{hasPermission(permission) ? children : fallback}</>;
}
