import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useQueries } from "@tanstack/react-query";
import type { DashboardWidgetDef } from "../types";
import { useOonApi } from "../api/ApiProvider";

export interface CoreDashboardProps {
  label?: string;
  widgets?: DashboardWidgetDef[];
}

/**
 * Dashboard do Core: renderiza widgets registrados (count/sum por model ou
 * render custom). Cache, loading e erro ficam no Core; a Central só declara.
 */
export function CoreDashboard({ label = "Dashboard", widgets = [] }: CoreDashboardProps) {
  const { resource } = useOonApi();

  const queries = useQueries({
    queries: widgets
      .filter((w) => w.kind !== "custom" && w.model)
      .map((w) => ({
        queryKey: ["oon", "widget", w.id],
        queryFn: async () => {
          const r = await resource(`/${w.model!.toLowerCase()}s`).list({ pageSize: w.kind === "sum" ? 200 : 1 });
          if (w.kind === "sum" && w.field) {
            return r.results.reduce((acc, row) => acc + Number((row as Record<string, unknown>)[w.field!] ?? 0), 0);
          }
          return r.pagination.totalItems;
        },
        staleTime: 60 * 1000,
      })),
  });

  let queryIdx = 0;

  return (
    <Stack gap={6}>
      <Heading size="lg">{label}</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {widgets.map((w) => {
          if (w.kind === "custom" && w.render) {
            return (
              <Box key={w.id} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={5}>
                {w.render()}
              </Box>
            );
          }
          const q = queries[queryIdx++];
          const value = q?.isLoading ? "…" : q?.isError ? "—" : formatWidget(q?.data, w.kind, w.field);
          return (
            <Box key={w.id} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={5}>
              <Text fontSize="sm" color="gray.500">
                {w.label}
              </Text>
              <Heading size="xl" mt={1}>
                {value}
              </Heading>
            </Box>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

function formatWidget(value: unknown, kind?: string, field?: string): string {
  if (value == null) return "—";
  if ((kind === "sum" && field?.toLowerCase().includes("valor")) || kind === "sum") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  }
  return String(value);
}
