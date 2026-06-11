import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AxiosInstance } from "axios";
import { useQuery } from "@tanstack/react-query";
import type { ModelSummary } from "../types";
import { createCoreClient, type CoreClient } from "./coreClient";
import { createResourceClient, type ResourceClient } from "./resourceClient";

interface ApiContextValue {
  http: AxiosInstance;
  core: CoreClient;
  resource: <T = Record<string, unknown>>(basePath: string) => ResourceClient<T>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ http, children }: { http: AxiosInstance; children: ReactNode }) {
  const value = useMemo<ApiContextValue>(() => {
    const cache = new Map<string, ResourceClient>();
    return {
      http,
      core: createCoreClient(http),
      resource<T = Record<string, unknown>>(basePath: string) {
        let client = cache.get(basePath);
        if (!client) {
          client = createResourceClient(http, basePath);
          cache.set(basePath, client);
        }
        return client as ResourceClient<T>;
      },
    };
  }, [http]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useOonApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useOonApi deve ser usado dentro de <ApiProvider> (oonCoreFront.start).");
  return ctx;
}

/** Cliente de um recurso, memoizado pelo basePath. */
export function useOonResource<T = Record<string, unknown>>(basePath: string): ResourceClient<T> {
  const { resource } = useOonApi();
  return useMemo(() => resource<T>(basePath), [resource, basePath]);
}

/** Metadata completa do back (cache de 5 min). */
export function useCoreMetadata() {
  const { core } = useOonApi();
  return useQuery({
    queryKey: ["oon", "core", "metadata"],
    queryFn: () => core.metadata(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Descrição de uma model específica — base do modo "dynamic". */
export function useModelSchema(name: string) {
  const { core } = useOonApi();
  return useQuery<ModelSummary>({
    queryKey: ["oon", "core", "model", name],
    queryFn: () => core.model(name),
    staleTime: 5 * 60 * 1000,
    enabled: !!name,
  });
}
