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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.4 12.4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      aria-hidden="true"
      style={{ display: "block", transition: "transform .15s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path d="m6 6 8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Campo relacionado no mesmo padrão explícito da Central Minexco. */
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
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const schemaQuery = useModelSchema(refModel);
  const schema = schemaQuery.data;
  const basePath = schema?.basePath ?? `/${refModel.toLowerCase()}s`;
  const resource = useOonResource<Record<string, unknown>>(basePath);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!value) setSelectedLabel("");
    else if (initialLabel) setSelectedLabel(initialLabel);
  }, [initialLabel, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const listQuery = useQuery({
    queryKey: ["oon", "reference-options", refModel, basePath, debouncedSearch],
    queryFn: () => resource.list({ pageIndex: 0, pageSize: 30, searchTerm: debouncedSearch || undefined }),
    enabled: !!schema && open,
    staleTime: 30_000,
  });

  const currentQuery = useQuery({
    queryKey: ["oon", "reference-current", refModel, basePath, value],
    queryFn: () => resource.get(value),
    enabled: !!schema && !!value && !selectedLabel,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!currentQuery.data) return;
    setSelectedLabel(referenceOptionLabel(currentQuery.data, schema?.searchable));
  }, [currentQuery.data, schema?.searchable]);

  const items = listQuery.data?.results ?? [];
  const listId = `oon-reference-${field}`;
  const resolvedInputId = inputId ?? `oon-reference-input-${field}`;
  const activeOptionId = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  const openList = (seed = "") => {
    if (seed) setSearch(seed);
    setOpen(true);
    setActiveIndex((current) => (current >= 0 ? current : 0));
  };

  const closeList = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const choose = (record: Record<string, unknown>) => {
    const id = referenceId(record);
    if (!id) return;
    onChange(id);
    setSelectedLabel(referenceOptionLabel(record, schema?.searchable));
    setSearch("");
    setDebouncedSearch("");
    closeList();
  };

  const clear = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onChange("");
    setSelectedLabel("");
    setSearch("");
    setDebouncedSearch("");
  };

  const moveActive = (direction: 1 | -1) => {
    if (!items.length) return;
    setActiveIndex((current) => {
      const start = current < 0 ? (direction === 1 ? -1 : 0) : current;
      const next = (start + direction + items.length) % items.length;
      window.setTimeout(() => optionRefs.current[next]?.scrollIntoView({ block: "nearest" }), 0);
      return next;
    });
  };

  return (
    <Box ref={rootRef} position="relative">
      <Button
        id={resolvedInputId}
        type="button"
        variant="outline"
        w="100%"
        minH="37px"
        h="auto"
        px="10px"
        py="8px"
        justifyContent="space-between"
        gap={2}
        color="#475467"
        bg="white"
        borderColor={invalid ? "#DC2626" : "#D5DDE3"}
        borderRadius="6px"
        boxShadow={invalid ? "0 0 0 3px rgba(220,38,38,.08)" : undefined}
        fontSize="11px"
        fontWeight="400"
        textAlign="left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? activeOptionId : undefined}
        aria-required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={error ? errorId : undefined}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) openList();
            else moveActive(1);
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openList();
            else moveActive(-1);
            return;
          }
          if (event.key === "Enter" && open && activeIndex >= 0 && items[activeIndex]) {
            event.preventDefault();
            choose(items[activeIndex]);
            return;
          }
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            closeList();
            return;
          }
          if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
            event.preventDefault();
            openList(event.key);
          }
        }}
        _hover={{ bg: "white", borderColor: "#B9C7D1" }}
        _focusVisible={{ borderColor: invalid ? "#DC2626" : "#0F8DD0", boxShadow: invalid ? "0 0 0 3px rgba(220,38,38,.08)" : "0 0 0 3px rgba(15,141,208,.10)" }}
      >
        <Text as="span" minW={0} flex="1" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" color={selectedLabel || value ? "#475467" : "#98A2B3"}>
          {selectedLabel || (value ? String(value) : "Selecione ou digite para pesquisar...")}
        </Text>
        <Flex as="span" align="center" gap={1} flex="0 0 auto" color="#98A2B3">
          {value ? (
            <Box
              as="span"
              role="button"
              tabIndex={0}
              aria-label={`Limpar ${label}`}
              w="20px"
              h="20px"
              display="grid"
              placeItems="center"
              borderRadius="4px"
              onClick={clear}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") clear(event);
              }}
              _hover={{ color: "#B42318", bg: "#FFF1F1" }}
            >
              <ClearIcon />
            </Box>
          ) : null}
          <ChevronIcon open={open} />
        </Flex>
      </Button>

      {open ? (
        <Box
          position="absolute"
          zIndex={120}
          top="calc(100% + 5px)"
          left={0}
          right={0}
          overflow="hidden"
          bg="white"
          borderWidth="1px"
          borderColor="#D5DDE3"
          borderRadius="8px"
          boxShadow="0 10px 30px rgba(15,23,42,.10)"
        >
          <Flex h="38px" px="10px" align="center" gap="7px" color="#98A2B3" borderBottomWidth="1px" borderColor="#E5E9ED">
            <SearchIcon />
            <Input
              ref={searchRef}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveIndex(0);
              }}
              placeholder="Digite para filtrar..."
              h="100%"
              p={0}
              color="#475467"
              bg="transparent"
              border={0}
              borderRadius={0}
              fontSize="11px"
              _focusVisible={{ boxShadow: "none", outline: "none" }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveActive(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(-1);
                } else if (event.key === "Enter" && activeIndex >= 0 && items[activeIndex]) {
                  event.preventDefault();
                  choose(items[activeIndex]);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  closeList();
                }
              }}
            />
          </Flex>

          <Stack id={listId} role="listbox" gap={0} maxH="230px" p="5px" overflowY="auto">
            {schemaQuery.isLoading || listQuery.isLoading ? (
              <Flex minH="54px" align="center" justify="center" gap={2} color="#98A2B3" fontSize="10px"><Spinner size="xs" /> Carregando...</Flex>
            ) : schemaQuery.isError || listQuery.isError ? (
              <Text py="18px" px="10px" color="#B42318" fontSize="10px" textAlign="center">Não foi possível carregar as opções.</Text>
            ) : items.length === 0 ? (
              <Text py="18px" px="10px" color="#98A2B3" fontSize="10px" textAlign="center">Nenhum registro encontrado.</Text>
            ) : (
              items.map((record, index) => {
                const id = referenceId(record);
                if (!id) return null;
                const selected = String(id) === String(value);
                const active = index === activeIndex;
                const optionLabel = referenceOptionLabel(record, schema?.searchable);
                const status = record.status;
                return (
                  <Button
                    id={`${listId}-option-${index}`}
                    ref={(element) => { optionRefs.current[index] = element; }}
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    w="100%"
                    minH="38px"
                    h="auto"
                    px="9px"
                    py="7px"
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    gap={0}
                    color={active || selected ? "#014364" : "#475467"}
                    bg={active || selected ? "#F0F7FF" : "transparent"}
                    border={0}
                    borderRadius="5px"
                    fontWeight="400"
                    textAlign="left"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(record)}
                    _hover={{ color: "#014364", bg: "#F0F7FF" }}
                  >
                    <Text as="strong" fontSize="10px" fontWeight="600">{optionLabel}</Text>
                    {status ? <Text as="small" color="#98A2B3" fontSize="9px" textTransform="capitalize">{String(status).replaceAll("_", " ")}</Text> : null}
                  </Button>
                );
              })
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
