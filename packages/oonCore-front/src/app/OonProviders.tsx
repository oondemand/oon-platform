import { type ReactNode, useMemo } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { OonCoreFrontConfig } from "../types";
import { createOonQueryClient } from "../config/queryClient";
import { createOonSystem } from "../config/theme";
import { ApiProvider } from "../api/ApiProvider";
import { AuthProvider } from "../security/AuthProvider";
import type { TokenStorage } from "../security/tokenStorage";

export interface OonProvidersProps {
  config: OonCoreFrontConfig;
  http: AxiosInstance;
  storage: TokenStorage;
  children: ReactNode;
}

/**
 * Monta, em ordem (Seção 3.3), todos os providers globais. Nenhuma Central
 * cliente deve montar QueryClient/Chakra/Auth/Api manualmente.
 *
 * Ordem: QueryClient -> Chakra -> Api -> Auth -> (Router, montado fora).
 */
export function OonProviders({ config, http, storage, children }: OonProvidersProps) {
  const queryClient = useMemo(() => createOonQueryClient(), []);
  const system = useMemo(() => createOonSystem(config.theme), [config.theme]);
  const loginUrl = config.auth?.loginUrl ?? config.api.meusAppsUrl;

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ApiProvider http={http}>
          <AuthProvider http={http} storage={storage} auth={config.auth} loginUrl={loginUrl}>
            {children}
          </AuthProvider>
        </ApiProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
