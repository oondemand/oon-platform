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

/** Combobox pesquisável para campos relacionados, com seleção e validação acessíveis. */
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, [open]);

  const listQuery = useQuery({
    queryKey: ["oon", "reference-options", refModel, basePath, debouncedFilter],
    queryFn: () => resource.list({ pageIndex: 0, pageSize: 100, searchTerm: debouncedFilter || undefined }),
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

  const options = listQuery.data?.results ?? [];
  const listId = `oon-reference-${field}`;
  const resolvedInputId = inputId ?? `oon-reference-input-${field}`;
  const activeOptionId = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  const openList = () => {
    setRequested(true);
    setOpen(true);
    setActiveIndex((current) => {
      if (current >= 0) return current;
      const selectedIndex = options.findIndex((row) => referenceId(row) === value);
      return selectedIndex >= 0 ? selectedIndex : 0;
    });
  };

  const closeList = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const selectOption = (row: Record<string, unknown>) => {
    const id = referenceId(row);
    if (!id) return;
    userEditedRef.current = false;
    setDisplayText(referenceOptionLabel(row, schema?.searchable));
    setFilterText("");
    setDebouncedFilter("");
    onChange(id);
    setRequested(false);
    closeList();
    inputRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    if (!open) openList();
    if (!options.length) return;
    setActiveIndex((current) => {
      const start = current < 0 ? (direction === 1 ? -1 : 0) : current;
      const next = (start + direction + options.length) % options.length;
      window.setTimeout(() => optionRefs.current[next]?.scrollIntoView({ block: "nearest" }), 0);
      return next;
    });
  };

  return (
    <Box ref={containerRef} position="relative">
      <label htmlFor={resolvedInputId}>
        <Text as="span" display="block" fontSize="12px" mb={1} fontWeight="600" color="#46545C">
          {label}{required ? <Text as="span" color="red.500"> *</Text> : null}
        </Text>
      </label>

      <Box position="relative">
        <Input
          id={resolvedInputId}
          ref={inputRef}
          size="sm"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-autocomplete="list"
          aria-required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          borderRadius="8px"
          borderColor={invalid ? "red.400" : "#DDE3E7"}
          boxShadow={invalid ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined}
          bg="white"
          placeholder="Selecione ou digite para pesquisar"
          value={displayText}
          pr="42px"
          required={required && !value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const text = event.currentTarget.value;
            userEditedRef.current = true;
            setDisplayText(text);
            setFilterText(text);
            setActiveIndex(0);
            onChange("");
            openList();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveActive(1);
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveActive(-1);
              return;
            }
            if (event.key === "Enter" && open && activeIndex >= 0 && options[activeIndex]) {
              event.preventDefault();
              selectOption(options[activeIndex]);
              return;
            }
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              closeList();
            }
          }}
          _focusVisible={{ borderColor: invalid ? "red.500" : "brand.500", boxShadow: `0 0 0 1px ${invalid ? "#E53E3E" : "#0474AF"}` }}
        />

        <Button
          type="button"
          variant="plain"
          aria-label={open ? `Fechar lista de ${label}` : `Abrir lista de ${label}`}
          aria-controls={listId}
          aria-expanded={open}
          position="absolute"
          top="50%"
          right="4px"
          transform="translateY(-50%)"
          minW="32px"
          w="32px"
          h="30px"
          p={0}
          borderRadius="6px"
          color="#64727A"
          _hover={{ bg: "#F1F4F5", color: "#24323A" }}
          _focusVisible={{ outline: "2px solid", outlineColor: "brand.500", outlineOffset: "-2px" }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) closeList();
            else openList();
            inputRef.current?.focus();
          }}
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            width="18"
            height="18"
            style={{
              display: "block",
              transition: "transform 0.15s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>

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
              <Flex align="center" gap={2} px={2} py={3}><Spinner size="sm" /><Text fontSize="sm">Carregando lista...</Text></Flex>
            ) : schemaQuery.isError || listQuery.isError ? (
              <Text fontSize="sm" color="red.600" px={2} py={3}>Não foi possível carregar os registros relacionados.</Text>
            ) : options.length === 0 ? (
              <Text fontSize="sm" color="gray.500" px={2} py={3}>Nenhum registro encontrado.</Text>
            ) : (
              <Stack gap={1}>
                {options.map((row, index) => {
                  const id = referenceId(row);
                  if (!id) return null;
                  const optionLabel = referenceOptionLabel(row, schema?.searchable);
                  const active = index === activeIndex;
                  const selected = id === value;
                  return (
                    <Button
                      id={`${listId}-option-${index}`}
                      ref={(element) => { optionRefs.current[index] = element; }}
                      key={id}
                      role="option"
                      aria-selected={selected}
                      size="sm"
                      variant="ghost"
                      colorPalette="brand"
                      type="button"
                      justifyContent="flex-start"
                      whiteSpace="normal"
                      textAlign="left"
                      h="auto"
                      py={2}
                      borderRadius="7px"
                      bg={active ? "brand.50" : selected ? "gray.100" : "transparent"}
                      color={active ? "brand.700" : "inherit"}
                      fontWeight={selected ? "600" : "400"}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectOption(row)}
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

      {error ? (
        <Text id={errorId} role="alert" fontSize="11px" color="red.600" mt={1}>{error}</Text>
      ) : value ? (
        <Text fontSize="11px" color="gray.500" mt={1}>Item selecionado</Text>
      ) : null}
    </Box>
  );
}
