import { useState } from "react";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CollectionMode, OonColumnDef, OonFormFieldDef } from "../types";
import { useModelSchema, useOonResource } from "../api/ApiProvider";
import { columnsFromMeta, formFieldsFromMeta } from "./internal/fieldUtils";
import { DataGrid } from "./internal/DataGrid";
import { DynamicForm } from "./internal/DynamicForm";
import { LoadingScreen } from "../shell/LoadingScreen";
import { ErrorState } from "../shell/ErrorState";

export interface CoreCollectionProps {
  model: string;
  label?: string;
  mode?: CollectionMode;
  endpoint?: string;
  columns?: OonColumnDef[];
  form?: OonFormFieldDef[];
  importExport?: boolean;
}

type FormState = { open: false } | { open: true; row?: Record<string, unknown> };

/** Coleção padrão: título operacional, datagrid denso e formulário em diálogo. */
export function CoreCollection({ model, label, mode = "dynamic", endpoint, columns, form, importExport }: CoreCollectionProps) {
  const needsSchema = mode !== "full" || !columns || !form || !endpoint;
  const schemaQuery = useModelSchema(needsSchema ? model : "");
  const schema = schemaQuery.data;
  const basePath = endpoint ?? schema?.basePath ?? `/${model.toLowerCase()}s`;
  const resolvedColumns = columns ?? (schema ? columnsFromMeta(schema.fields) : []);
  const resolvedForm = form ?? (schema ? formFieldsFromMeta(schema.fields) : []);

  const resource = useOonResource(basePath);
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [formError, setFormError] = useState<unknown>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["oon", "list", basePath] });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const editingRow = formState.open ? formState.row : undefined;
      const id = editingRow?._id as string | undefined;
      return id ? resource.update(id, values) : resource.create(values);
    },
    onSuccess: () => {
      setFormState({ open: false });
      setFormError(null);
      invalidate();
    },
    onError: (error) => setFormError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: Record<string, unknown>) => resource.delete(row._id as string),
    onSuccess: invalidate,
  });

  if (needsSchema && schemaQuery.isLoading) return <LoadingScreen />;
  if (needsSchema && schemaQuery.isError) return <ErrorState error={schemaQuery.error} />;

  const title = label ?? schema?.name ?? model;

  return (
    <Stack gap={5}>
      <Box>
        <Text fontSize="11px" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.08em" mb={1}>
          Coleção
        </Text>
        <Heading size="lg" color="#24323A" letterSpacing="-0.02em">
          {title}
        </Heading>
        <Text mt={1} fontSize="13px" color="gray.500">
          Consulte, filtre e mantenha os registros desta operação.
        </Text>
      </Box>

      <DataGrid
        resource={resource}
        resourceKey={basePath}
        columns={resolvedColumns}
        onCreate={() => {
          setFormError(null);
          setFormState({ open: true });
        }}
        onEdit={(row) => {
          setFormError(null);
          setFormState({ open: true, row });
        }}
        onDelete={(row) => {
          if (window.confirm("Excluir este registro?")) deleteMutation.mutate(row);
        }}
      />

      {formState.open ? (
        <DynamicForm
          title={formState.row ? `Editar ${title}` : `Novo ${title}`}
          fields={resolvedForm}
          initialValues={formState.row}
          submitting={saveMutation.isPending}
          error={formError}
          onSubmit={(values) => {
            setFormError(null);
            saveMutation.mutate(values);
          }}
          onFieldChange={() => setFormError(null)}
          onCancel={() => {
            setFormState({ open: false });
            setFormError(null);
          }}
        />
      ) : null}

      {importExport ? null : null}
    </Stack>
  );
}
