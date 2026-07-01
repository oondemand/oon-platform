import { useState } from "react";
import { Badge, Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModelSchema, useOonResource } from "../api/ApiProvider";
import { LoadingScreen } from "../shell/LoadingScreen";
import { ErrorState } from "../shell/ErrorState";
import { DynamicForm } from "./internal/DynamicForm";
import { fieldLabel, formatCell, formFieldsFromMeta } from "./internal/fieldUtils";

export interface CorePipelineProps {
  model: string;
  label?: string;
  endpoint?: string;
  stageField?: string;
  stages?: Array<{ id: string; label: string }>;
  titleField?: string;
}

function ticketId(row: Record<string, unknown>): string | undefined {
  const id = row._id ?? row.id;
  return id == null ? undefined : String(id);
}

/** Esteira horizontal padrão, com tickets clicáveis e formulário completo em modal. */
export function CorePipeline({ model, label, endpoint, stageField = "status", stages, titleField }: CorePipelineProps) {
  const schemaQuery = useModelSchema(model);
  const schema = schemaQuery.data;
  const basePath = endpoint ?? schema?.basePath ?? `/${model.toLowerCase()}s`;
  const resource = useOonResource(basePath);
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Record<string, unknown> | null>(null);
  const [formError, setFormError] = useState<unknown>(null);

  const listQuery = useQuery({
    queryKey: ["oon", "pipeline", basePath],
    queryFn: () => resource.list({ pageSize: 200 }),
    enabled: !!schema,
  });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const id = selectedTicket ? ticketId(selectedTicket) : undefined;
      if (!id) throw new Error("Não foi possível identificar o ticket selecionado.");
      return resource.update(id, values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["oon", "pipeline", basePath] });
      setSelectedTicket(null);
      setFormError(null);
    },
    onError: (error) => setFormError(error),
  });

  if (schemaQuery.isLoading || listQuery.isLoading) return <LoadingScreen />;
  if (schemaQuery.isError) return <ErrorState error={schemaQuery.error} />;
  if (listQuery.isError) return <ErrorState error={listQuery.error} />;

  const stageFieldMeta = schema?.fields.find((field) => field.name === stageField);
  const resolvedStages = stages ?? (stageFieldMeta?.options ?? []).map((option) => ({ id: option, label: option }));
  const title = titleField ?? schema?.fields.find((field) => field.kind === "string")?.name ?? schema?.searchable[0] ?? "_id";
  const detailFields = (schema?.fields ?? [])
    .filter((field) => field.name !== stageField && field.name !== title && !["raw"].includes(field.kind))
    .slice(0, 3);
  const formFields = formFieldsFromMeta(schema?.fields ?? []);

  const rows = listQuery.data?.results ?? [];
  const byStage = new Map<string, Record<string, unknown>[]>();
  for (const stage of resolvedStages) byStage.set(stage.id, []);
  for (const row of rows) {
    const key = String(row[stageField] ?? "");
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(row);
  }

  return (
    <Stack gap={5}>
      <Box>
        <Text fontSize="11px" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.08em" mb={1}>
          Esteira de processo
        </Text>
        <Heading size="lg" color="#24323A" letterSpacing="-0.02em">
          {label ?? schema?.name ?? model}
        </Heading>
        <Text mt={1} fontSize="13px" color="gray.500">
          Acompanhe os tickets por etapa e visualize os principais dados de cada item.
        </Text>
      </Box>

      <Flex gap={4} align="stretch" overflowX="auto" pb={3} minH="420px">
        {Array.from(byStage.entries()).map(([stageId, items]) => {
          const stageLabel = resolvedStages.find((stage) => stage.id === stageId)?.label ?? (stageId || "Sem etapa");
          return (
            <Box
              key={stageId}
              minW="300px"
              maxW="340px"
              flex="1 0 300px"
              bg="#E8ECEF"
              borderRadius="12px"
              p={3}
              borderWidth="1px"
              borderColor="#DDE3E7"
            >
              <Flex align="center" justify="space-between" mb={3} px={1}>
                <Text fontWeight="700" fontSize="12px" color="#33434C" textTransform="uppercase" letterSpacing="0.03em">
                  {stageLabel}
                </Text>
                <Badge colorPalette="brand" variant="solid" borderRadius="full" minW="24px" justifyContent="center">
                  {items.length}
                </Badge>
              </Flex>

              <Stack gap={2}>
                {items.length === 0 ? (
                  <Box borderWidth="1px" borderStyle="dashed" borderColor="#C8D0D5" borderRadius="10px" p={5} textAlign="center">
                    <Text fontSize="12px" color="gray.500">Nenhum ticket nesta etapa.</Text>
                  </Box>
                ) : (
                  items.map((row, index) => {
                    const ticketTitle = formatCell(row[title], "string");
                    return (
                      <Button
                        key={ticketId(row) ?? index}
                        type="button"
                        variant="plain"
                        display="block"
                        w="100%"
                        h="auto"
                        minH="auto"
                        p={3}
                        bg="white"
                        borderRadius="10px"
                        borderWidth="1px"
                        borderColor="#DDE3E7"
                        boxShadow="0 3px 10px rgba(7, 38, 46, 0.05)"
                        textAlign="left"
                        whiteSpace="normal"
                        transition="all 0.15s ease"
                        aria-label={`Abrir ticket ${ticketTitle}`}
                        onClick={() => {
                          setFormError(null);
                          setSelectedTicket(row);
                        }}
                        _hover={{ borderColor: "brand.300", transform: "translateY(-1px)", boxShadow: "0 7px 18px rgba(7, 38, 46, 0.09)" }}
                        _focusVisible={{ borderColor: "brand.500", boxShadow: "0 0 0 3px rgba(4, 116, 175, 0.16)" }}
                      >
                        <Text fontSize="13px" fontWeight="700" color="#24323A" mb={2} lineClamp={2}>
                          {ticketTitle}
                        </Text>
                        <Stack gap={1}>
                          {detailFields.map((field) => (
                            <Flex key={field.name} gap={2} align="baseline" justify="space-between">
                              <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.03em">
                                {fieldLabel(field)}
                              </Text>
                              <Text fontSize="11px" color="#46545C" fontWeight="500" textAlign="right" lineClamp={1}>
                                {formatCell(row[field.name], field.kind)}
                              </Text>
                            </Flex>
                          ))}
                        </Stack>
                      </Button>
                    );
                  })
                )}
              </Stack>
            </Box>
          );
        })}
      </Flex>

      {selectedTicket ? (
        <DynamicForm
          title={`Editar ${schema?.singular ?? label ?? model}`}
          eyebrow="Ticket"
          fields={formFields}
          initialValues={selectedTicket}
          submitting={saveMutation.isPending}
          error={formError}
          onSubmit={(values) => {
            setFormError(null);
            saveMutation.mutate(values);
          }}
          onFieldChange={() => setFormError(null)}
          onCancel={() => {
            if (saveMutation.isPending) return;
            setSelectedTicket(null);
            setFormError(null);
          }}
        />
      ) : null}
    </Stack>
  );
}
