import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useModelSchema, useOonResource } from "../api/ApiProvider";
import { LoadingScreen } from "../shell/LoadingScreen";
import { ErrorState } from "../shell/ErrorState";
import { formatCell } from "./internal/fieldUtils";

export interface CorePipelineProps {
  model: string;
  label?: string;
  endpoint?: string;
  /** campo do registro que define a coluna/etapa. Default: "status". */
  stageField?: string;
  /** etapas fixas; se omitido, derivadas do enum de `stageField`. */
  stages?: Array<{ id: string; label: string }>;
  /** campo exibido como título do card. Default: primeiro string. */
  titleField?: string;
}

/**
 * Esteira (kanban) genérica do Core. Agrupa registros por `stageField` em
 * colunas. As etapas vêm das props ou são derivadas do enum declarado na
 * metadata da model — nenhuma esteira específica hardcoded.
 */
export function CorePipeline({ model, label, endpoint, stageField = "status", stages, titleField }: CorePipelineProps) {
  const schemaQuery = useModelSchema(model);
  const schema = schemaQuery.data;
  const basePath = endpoint ?? schema?.basePath ?? `/${model.toLowerCase()}s`;
  const resource = useOonResource(basePath);

  const listQuery = useQuery({
    queryKey: ["oon", "pipeline", basePath],
    queryFn: () => resource.list({ pageSize: 200 }),
    enabled: !!schema,
  });

  if (schemaQuery.isLoading || listQuery.isLoading) return <LoadingScreen />;
  if (schemaQuery.isError) return <ErrorState error={schemaQuery.error} />;
  if (listQuery.isError) return <ErrorState error={listQuery.error} />;

  const stageFieldMeta = schema?.fields.find((f) => f.name === stageField);
  const resolvedStages =
    stages ??
    (stageFieldMeta?.options ?? []).map((opt) => ({ id: opt, label: opt })) ?? [];

  const title =
    titleField ?? schema?.fields.find((f) => f.kind === "string")?.name ?? schema?.searchable[0] ?? "_id";

  const rows = listQuery.data?.results ?? [];
  const byStage = new Map<string, Record<string, unknown>[]>();
  for (const stage of resolvedStages) byStage.set(stage.id, []);
  for (const row of rows) {
    const key = String(row[stageField] ?? "");
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(row);
  }

  return (
    <Stack gap={6}>
      <Heading size="lg">{label ?? schema?.name ?? model}</Heading>
      <Flex gap={4} align="stretch" overflowX="auto" pb={2}>
        {Array.from(byStage.entries()).map(([stageId, items]) => {
          const stageLabel = resolvedStages.find((s) => s.id === stageId)?.label ?? (stageId || "—");
          return (
            <Box key={stageId} minW="280px" bg="gray.100" borderRadius="md" p={3}>
              <Flex align="center" justify="space-between" mb={3}>
                <Text fontWeight="semibold" fontSize="sm">
                  {stageLabel}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {items.length}
                </Text>
              </Flex>
              <Stack gap={2}>
                {items.map((row, idx) => (
                  <Box key={(row._id as string) ?? idx} bg="white" borderRadius="md" p={3} borderWidth="1px" borderColor="gray.200">
                    <Text fontSize="sm" fontWeight="medium">
                      {formatCell(row[title], "string")}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Flex>
    </Stack>
  );
}
