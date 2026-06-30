import { useDeferredValue, useState, type ReactNode } from "react";
import { Badge, Box, Button, Flex, Input, NativeSelect, Spacer, Table, Text } from "@chakra-ui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FieldKind, OonColumnDef } from "../../types";
import type { ResourceClient } from "../../api/resourceClient";
import { formatCell } from "./fieldUtils";
import { LoadingScreen } from "../../shell/LoadingScreen";
import { ErrorState } from "../../shell/ErrorState";

export interface DataGridProps {
  resource: ResourceClient;
  resourceKey: string;
  columns: OonColumnDef[];
  search?: boolean;
  onCreate?: () => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  toolbarExtra?: ReactNode;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.4 12.4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M4 14.5V16h1.5L14.7 6.8l-1.5-1.5L4 14.5Z" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      <path d="m12.5 6 1.5-1.5a1.05 1.05 0 0 1 1.5 0l.1.1a1.05 1.05 0 0 1 0 1.5L14.1 7.6" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path d="M5.5 6.5h9l-.6 9H6.1l-.6-9Zm2-2h5l.7 2H6.8l.7-2Z" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M4.5 6.5h11" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}>
      <path d="m12 5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function renderCell(value: unknown, kind?: FieldKind) {
  const formatted = formatCell(value, kind);

  if (kind === "enum") {
    const normalized = String(value ?? "").toLowerCase();
    const palette = /erro|cancel|inativo|recus|critica/.test(normalized)
      ? "red"
      : /pendente|aguardando|rascunho/.test(normalized)
        ? "orange"
        : /processando|conferencia|integrando|validando/.test(normalized)
          ? "blue"
          : /ativo|sucesso|conclu|aplicada|disponivel|aprov/.test(normalized)
            ? "green"
            : "gray";
    return (
      <Badge colorPalette={palette} variant="subtle" borderRadius="full" px="7px" py="3px" fontSize="9px" fontWeight="600" textTransform="capitalize">
        {formatted}
      </Badge>
    );
  }

  if (kind === "boolean") {
    const active = value === true || value === "true";
    return (
      <Badge colorPalette={active ? "green" : "gray"} variant="subtle" borderRadius="full" px="7px" py="3px" fontSize="9px" fontWeight="600">
        {formatted}
      </Badge>
    );
  }

  return formatted;
}

/** Datagrid no mesmo padrão explícito da Central Minexco. */
export function DataGrid({
  resource,
  resourceKey,
  columns,
  search = true,
  onCreate,
  onEdit,
  onDelete,
  toolbarExtra,
}: DataGridProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [sort, setSort] = useState<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ["oon", "list", resourceKey, { pageIndex, pageSize, searchTerm: deferredSearch, sort }],
    queryFn: () => resource.list({ pageIndex, pageSize, searchTerm: deferredSearch || undefined, sort }),
    placeholderData: keepPreviousData,
  });

  const toggleSort = (field: string) => {
    setPageIndex(0);
    setSort((previous) => {
      if (previous === `${field}.asc`) return `${field}.desc`;
      if (previous === `${field}.desc`) return undefined;
      return `${field}.asc`;
    });
  };

  const pagination = query.data?.pagination;
  const rows = query.data?.results ?? [];
  const totalItems = pagination?.totalItems ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = Math.min(pageIndex + 1, totalPages);
  const actionCount = onEdit || onDelete ? 1 : 0;

  return (
    <Box bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="10px" boxShadow="0 1px 2px rgba(15,23,42,.06)" overflow="hidden">
      <Flex minH="60px" px="14px" py="12px" align="center" gap={4} borderBottomWidth="1px" borderColor="#E5E9ED">
        {search ? (
          <Flex minW={{ base: "100%", md: "min(420px, 55vw)" }} maxW="420px" h="35px" px="10px" align="center" gap={2} color="#98A2B3" bg="white" borderWidth="1px" borderColor="#D5DDE3" borderRadius="6px" _focusWithin={{ borderColor: "#0F8DD0", boxShadow: "0 0 0 3px rgba(15,141,208,.10)" }}>
            <SearchIcon />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPageIndex(0);
              }}
              placeholder="Pesquisar registros..."
              h="100%"
              p={0}
              color="#475467"
              bg="transparent"
              border={0}
              borderRadius={0}
              fontSize="11px"
              _placeholder={{ color: "#A6B0BC" }}
              _focusVisible={{ boxShadow: "none", outline: "none" }}
            />
          </Flex>
        ) : null}

        <Spacer />
        <Flex align="center" gap={3} color="#98A2B3" fontSize="10px">
          {query.isFetching ? <Text>Atualizando...</Text> : null}
          <Text as="strong" color="#667085" fontWeight="600">
            {totalItems} registro{totalItems === 1 ? "" : "s"}
          </Text>
        </Flex>
        {toolbarExtra}
        {onCreate ? (
          <Button minH="35px" px="13px" colorPalette="brand" borderRadius="6px" fontSize="11px" fontWeight="600" onClick={onCreate}>
            <PlusIcon /> Novo registro
          </Button>
        ) : null}
      </Flex>

      {query.isLoading ? (
        <LoadingScreen />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm" minW="900px" borderCollapse="collapse">
            <Table.Header>
              <Table.Row bg="#F4F7F9">
                {columns.map((column) => (
                  <Table.ColumnHeader
                    key={column.field}
                    h="39px"
                    px="10px"
                    py="8px"
                    color="#667085"
                    borderBottomWidth="1px"
                    borderColor="#D5DDE3"
                    fontSize="10px"
                    fontWeight="600"
                    letterSpacing=".015em"
                    textTransform="none"
                    whiteSpace="nowrap"
                    cursor={column.sortable ? "pointer" : undefined}
                    onClick={column.sortable ? () => toggleSort(column.field) : undefined}
                  >
                    {column.label ?? column.field}
                    {sort?.startsWith(`${column.field}.`) ? (sort.endsWith(".asc") ? " ▲" : " ▼") : ""}
                  </Table.ColumnHeader>
                ))}
                {actionCount ? (
                  <Table.ColumnHeader w="84px" h="39px" px="10px" py="8px" color="#667085" borderBottomWidth="1px" borderColor="#D5DDE3" fontSize="10px" fontWeight="600" textAlign="center">
                    Ações
                  </Table.ColumnHeader>
                ) : null}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length + actionCount}>
                    <Text minH="140px" display="grid" placeItems="center" color="#98A2B3" fontSize="12px">
                      Nenhum registro encontrado.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((row, index) => (
                  <Table.Row key={(row._id as string) ?? index} bg={index % 2 ? "#FBFCFD" : "white"} _hover={{ bg: "#F0F7FF" }}>
                    {columns.map((column) => (
                      <Table.Cell key={column.field} maxW="250px" h="42px" px="10px" py="8px" overflow="hidden" color="#52606D" borderBottomWidth="1px" borderColor="#EEF1F3" fontSize="11px" textOverflow="ellipsis" whiteSpace="nowrap">
                        {renderCell(row[column.field], column.kind)}
                      </Table.Cell>
                    ))}
                    {actionCount ? (
                      <Table.Cell h="42px" px="10px" py="5px" borderBottomWidth="1px" borderColor="#EEF1F3" textAlign="center">
                        <Flex justify="center" gap="5px">
                          {onEdit ? (
                            <Button type="button" aria-label="Editar" w="31px" minW="31px" h="31px" p={0} color="#667085" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="6px" onClick={() => onEdit(row)} _hover={{ color: "#036491", bg: "#F0F7FF", borderColor: "#B8D9EB" }}>
                              <EditIcon />
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button type="button" aria-label="Excluir" w="31px" minW="31px" h="31px" p={0} color="#667085" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="6px" onClick={() => onDelete(row)} _hover={{ color: "#B42318", bg: "#FFF5F5", borderColor: "#FECACA" }}>
                              <TrashIcon />
                            </Button>
                          ) : null}
                        </Flex>
                      </Table.Cell>
                    ) : null}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <Flex minH="56px" px="14px" py="10px" align="center" justify="flex-end" gap="18px" color="#7B8794" borderTopWidth="1px" borderColor="#E5E9ED" fontSize="10px" flexWrap="wrap">
        <Flex align="center" gap={2}>
          <Text>Linhas por página</Text>
          <NativeSelect.Root size="xs" w="68px">
            <NativeSelect.Field
              value={pageSize}
              h="30px"
              pl="8px"
              pr="26px"
              color="#52606D"
              bg="white"
              borderColor="#D5DDE3"
              borderRadius="5px"
              fontSize="10px"
              onChange={(event) => {
                setPageSize(Number(event.currentTarget.value));
                setPageIndex(0);
              }}
            >
              {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Flex>

        <Text>Página {currentPage} de {totalPages}</Text>

        <Flex gap="5px">
          <Button type="button" aria-label="Página anterior" w="31px" minW="31px" h="31px" p={0} color="#667085" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="6px" disabled={pageIndex <= 0} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} _hover={{ color: "#036491", bg: "#F0F7FF", borderColor: "#B8D9EB" }}>
            <ChevronIcon direction="left" />
          </Button>
          <Button type="button" aria-label="Próxima página" w="31px" minW="31px" h="31px" p={0} color="#667085" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="6px" disabled={currentPage >= totalPages} onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))} _hover={{ color: "#036491", bg: "#F0F7FF", borderColor: "#B8D9EB" }}>
            <ChevronIcon direction="right" />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
