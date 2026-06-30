import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useModelSchema, useOonResource } from "../../api/ApiProvider";
import { initialReferenceLabel, referenceId, referenceOptionLabel } from "./referenceUtils";

export interface ReferenceSelectProps {
  field: string;
  inputId?: string;
  errorId?: string;
  label: string;
  refModel: string;
  value: string;
  initialValue?: unknown;
  required?: boolean;
  invalid?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

/** Seleção pesquisável para campos relacionados, com validação visual explícita. */
export function ReferenceSelect({
  field,
  inputId,
  errorId,
  label,
  refModel,
  value,
  initialValue,
  required,
  invalid,
  error,
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
  const resolvedInputId = inputId ?? `oon-reference-input-${field}`;

  return (
    <Box ref={containerRef} position="relative">
      <Text as="label" htmlFor={resolvedInputId} fontSize="12px" mb={1} fontWeight="600" color="#46545C">
        {label}
        {required ? <Text as="span" color="red.500"> *</Text> : null}
      </Text>

      <Flex gap={2} align="center">
        <Input
          id={resolvedInputId}
          ref={inputRef}
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          borderRadius="8px"
          borderColor={invalid ? "red.400" : "#DDE3E7"}
          boxShadow={invalid ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined}
          bg="white"
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
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
          _focusVisible={{ borderColor: invalid ? "red.500" : "brand.500", boxShadow: `0 0 0 1px ${invalid ? "#E53E3E" : "#0474AF"}` }}
        />

        <Button
          size="sm"
          variant="outline"
          type="button"
          flex="0 0 auto"
          minW="92px"
          borderRadius="8px"
          onClick={() => {
            if (open) setOpen(false);
            else openList();
          }}
        >
          {open ? "Fechar" : "Abrir lista"}
        </Button>

        {displayText || value ? (
          <Button size="sm" variant="ghost" type="button" borderRadius="8px" onClick={clear}>
            Limpar
          </Button>
        ) : null}
      </Flex>

      {error ? (
        <Text id={errorId} role="alert" fontSize="11px" color="red.600" mt={1}>
          {error}
        </Text>
      ) : value ? (
        <Text fontSize="11px" color="gray.500" mt={1}>
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
          zIndex={30}
          bg="white"
          borderWidth="1px"
          borderColor="#DDE3E7"
          borderRadius="9px"
          boxShadow="0 12px 30px rgba(7, 38, 46, 0.14)"
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
                    colorPalette="brand"
                    type="button"
                    justifyContent="flex-start"
                    whiteSpace="normal"
                    textAlign="left"
                    h="auto"
                    py={2}
                    borderRadius="7px"
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
