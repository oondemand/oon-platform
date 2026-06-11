import { useState } from "react";
import { Box, Heading, Stack } from "@chakra-ui/react";
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
  /**
   * Três formas de declarar a coleção (Seção 4.4):
   *  - "full"    : colunas + form explícitos (passe `columns` e `form`).
   *  - "minimal" : só `model`; Core busca a metadata e deriva tudo.
   *  - "dynamic" : 100% dirigido por /core/models/:model (default).
   */
  mode?: CollectionMode;
  /** basePath do recurso; default vem da metadata da model. */
  endpoint?: string;
  columns?: OonColumnDef[];
  form?: OonFormFieldDef[];
  importExport?: boolean;
}

type FormState = { open: false } | { open: true; row?: Record<string, unknown> };

/**
 * Componente Core de coleção. Renderiza grid + form de qualquer model do back
 * sem código de UI por entidade. No modo dinâmico, lê /core/models/:model e
 * monta colunas, formulário e endpoint a partir da metadata — esse é o
 * critério de pronto da Fase 3.
 */
export function CoreCollection({ model, label, mode = "dynamic", endpoint, columns, form, importExport }: CoreCollectionProps) {
  const needsSchema = mode !== "full" || !columns || !form || !endpoint;
  const schemaQuery = useModelSchema(needsSchema ? model : "");

  // Resolve endpoint/colunas/form: props têm prioridade; metadata preenche o resto.
  const schema = schemaQuery.data;
  const basePath = endpoint ?? schema?.basePath ?? `/${model.toLowerCase()}s`;
  const resolvedColumns = columns ?? (schema ? columnsFromMeta(schema.fields) : []);
  const resolvedForm = form ?? (schema ? formFieldsFromMeta(schema.fields) : []);

  const resource = useOonResource(basePath);
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [formError, setFormError] = useState<string | null>(null);

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
    onError: (err) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: Record<string, unknown>) => resource.delete(row._id as string),
    onSuccess: invalidate,
  });

  if (needsSchema && schemaQuery.isLoading) return <LoadingScreen />;
  if (needsSchema && schemaQuery.isError) return <ErrorState error={schemaQuery.error} />;

  const title = label ?? schema?.name ?? model;

  return (
    <Stack gap={6}>
      <Heading size="lg">{title}</Heading>

      {formState.open ? (
        <DynamicForm
          title={formState.row ? `Editar ${title}` : `Novo ${title}`}
          fields={resolvedForm}
          initialValues={formState.row}
          submitting={saveMutation.isPending}
          error={formError}
          onSubmit={(values) => saveMutation.mutate(values)}
          onCancel={() => {
            setFormState({ open: false });
            setFormError(null);
          }}
        />
      ) : (
        <Box>
          <DataGrid
            resource={resource}
            resourceKey={basePath}
            columns={resolvedColumns}
            onCreate={() => setFormState({ open: true })}
            onEdit={(row) => setFormState({ open: true, row })}
            onDelete={(row) => {
              if (window.confirm("Excluir este registro?")) deleteMutation.mutate(row);
            }}
          />
          {importExport ? null /* hook de import/export entra aqui (resource.importMany/exportAll) */ : null}
        </Box>
      )}
    </Stack>
  );
}
