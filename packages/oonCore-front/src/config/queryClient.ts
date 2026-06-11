import { QueryClient } from "@tanstack/react-query";

/** QueryClient padrão do Core, com defaults conservadores para telas admin. */
export function createOonQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30 * 1000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
