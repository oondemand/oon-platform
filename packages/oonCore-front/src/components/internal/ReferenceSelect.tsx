import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useModelSchema, useOonResource } from "../../api/ApiProvider";

export interface ReferenceSelectProps {
  field: string;
  label: string;
  refModel: string;
  value: string;
  initialValue?: unknown;
  required?: boolean;
  onChange: (value: string) => void;
}

const COMMON_LABEL_FIELDS = [
  "nome",
  "razaoSocial",
  "razao_social",
  "descricao",
  "numero",
  "codigoIndividual",
  "codigo_individual",
  "codigo",
  "label",
  "email",
];

function primitiveText(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

/**
 * Resolve um rótulo humano para qualquer registro relacionado. Prioriza campos
 * conhecidos e depois os campos pesquisáveis expostos pela metadata.
 */
export function referenceOptionLabel(
  row: Record<string, unknown>,
  searchableFields: string[] = []
): string {
  const ordered = [...COMMON_LABEL_FIELDS, ...searchableFields];
  const seenFields = new Set<string>();
  const seenValues = new Set<string>();
  const values: string[] = [];

  for (const field of ordered) {
    if (seenFields.has(field)) continue;
    seenFields.add(field);
    const text = primitiveText(row[field]);
    if (!text || seenValues.has(text)) continue;
    seenValues.add(text);
    values.push(text);
    if (values.length === 2) break;
  }

  if (values.length) return values.join(" — ");
  return primitiveText(row._id) ?? primitiveText(row.id) ?? "Registro sem identificação";
}

function initialReferenceLabel(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return referenceOptionLabel(value as Record<string, unknown>);
}

function referenceId(row: Record<string, unknown>): string {
  return String(row._id ?? row.id ?? "");
}

/**
 * Caixa de seleção genérica para campos `ref`.
 *
 * - "Abrir lista" carrega os registros relacionados;
 * - digitar filtra no backend usando `searchTerm`;
 * - a opção salva sempre o `_id`, nunca o texto exibido;
 * - ao editar, busca o registro atual quando o backend devolve só o ObjectId.
 */
export function ReferenceSelect({
  field,
  label,
  refModel,
  value,
  initialValue,
  required,
  onChange,
}: ReferenceSelectProps) {
  const initialLabel = useMemo(() => initialReferenceLabel(initialValue), [initialValue]);
  const [displayText, setDisplayText] = useState(initialLabel);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const userEditedRef = useRef(false);

  const schemaQuery = useModelSchema(refModel);
  const schema = schemaQuery.data;
  const basePath = schema?.basePath ?? `/${refModel.toLowerCase()}s`;
  const resource = useOonResource<Record<string, unknown>>(basePath);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilter(filterText.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [filterText]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setCustomValidity(required && !value ? "Selecione um item da lista." : "");
  }, [required, value]);

  useEffect(() => {
    if (!open) return;
    const closeWhenOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, [open]);

  const listQuery = useQuery({
    queryKey: ["oon", "reference-options", refModel, basePath, debouncedFilter],
    queryFn: () =>
      resource.list({
        pageIndex: 0,
        pageSize: 100,
        searchTerm: debouncedFilter || undefined,
      }),
    enabled: !!schema && requested,
    staleTime: 30_000,
  });

  const currentQuery = useQuery({
    queryKey: ["oon", "reference-current", refModel, basePath, value],
    queryFn: () => resource.get(value),
    enabled: !!schema && !!value && !initialLabel,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!currentQuery.data || userEditedRef.current) return;
    setDisplayText(referenceOptionLabel(currentQuery.data, schema?.searchable));
  }, [currentQuery.data, schema?.searchable]);

  const openList = () => {
    setRequested(true);
    setOpen(true);
  };

  const clear = () => {
    userEditedRef.current = false;
    setDisplayText("");
    setFilterText("");
    setDebouncedFilter("");
    onChange("");
    inputRef.current?.focus();
  };

  const options = listQuery.data?.results ?? [];
  const listId = `oon-reference-${field}`;

  return (
    <Box ref={containerRef} position="relative">
      <Text fontSize="sm" mb={1} fontWeight="medium">
        {label}
        {required ? " *" : ""}
      </Text>

      <Flex gap={2} align="center">
        <Input
          ref={inputRef}
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Digite para filtrar"
          value={displayText}
          required={required && !value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const text = event.currentTarget.value;
            userEditedRef.current = true;
            setDisplayText(text);
            setFilterText(text);
            onChange("");
            openList();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") openList();
            if (event.key === "Escape") setOpen(false);
          }}
        />

        <Button
          size="sm"
          variant="outline"
          type="button"
          minW="92px"
          onClick={() => {
            if (open) setOpen(false);
            else openList();
          }}
        >
          {open ? "Fechar" : "Abrir lista"}
        </Button>

        {displayText || value ? (
          <Button size="sm" variant="ghost" type="button" onClick={clear}>
            Limpar
          </Button>
        ) : null}
      </Flex>

      {value ? (
        <Text fontSize="xs" color="gray.500" mt={1}>
          Item selecionado
        </Text>
      ) : null}

      {open ? (
        <Box
          id={listId}
          role="listbox"
          position="absolute"
          left={0}
          right={0}
          top="calc(100% + 4px)"
          zIndex={20}
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
          maxH="260px"
          overflowY="auto"
          p={2}
        >
          {schemaQuery.isLoading || listQuery.isLoading ? (
            <Flex align="center" gap={2} px={2} py={3}>
              <Spinner size="sm" />
              <Text fontSize="sm">Carregando lista...</Text>
            </Flex>
          ) : schemaQuery.isError || listQuery.isError ? (
            <Text fontSize="sm" color="red.600" px={2} py={3}>
              Não foi possível carregar os registros relacionados.
            </Text>
          ) : options.length === 0 ? (
            <Text fontSize="sm" color="gray.500" px={2} py={3}>
              Nenhum registro encontrado.
            </Text>
          ) : (
            <Stack gap={1}>
              {options.map((row) => {
                const id = referenceId(row);
                if (!id) return null;
                const optionLabel = referenceOptionLabel(row, schema?.searchable);
                return (
                  <Button
                    key={id}
                    role="option"
                    aria-selected={id === value}
                    size="sm"
                    variant={id === value ? "subtle" : "ghost"}
                    type="button"
                    justifyContent="flex-start"
                    whiteSpace="normal"
                    textAlign="left"
                    h="auto"
                    py={2}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      userEditedRef.current = false;
                      setDisplayText(optionLabel);
                      setFilterText("");
                      setDebouncedFilter("");
                      onChange(id);
                      setOpen(false);
                      setRequested(false);
                    }}
                  >
                    {optionLabel}
                  </Button>
                );
              })}
            </Stack>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
