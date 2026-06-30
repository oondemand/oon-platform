import { useState, type ReactNode } from "react";
import { Badge, Box, Button, Flex, Input, Spacer, Table, Text } from "@chakra-ui/react";
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

const PAGE_SIZE = 20;

function renderCell(value: unknown, kind?: FieldKind) {
  const formatted = formatCell(value, kind);

  if (kind === "enum") {
    return (
      <Badge colorPalette="brand" variant="subtle" borderRadius="full" px={2} py="2px" fontWeight="600">
        {formatted}
      </Badge>
    );
  }

  if (kind === "boolean") {
    const active = value === true || value === "true";
    return (
      <Badge colorPalette={active ? "green" : "gray"} variant="subtle" borderRadius="full" px={2} py="2px">
        {formatted}
      </Badge>
    );
  }

  return formatted;
}

/** Grid genérico, denso e operacional, com busca, ordenação e paginação server-side. */
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<string | undefined>(undefined);

  const query = useQuery({
    queryKey: ["oon", "list", resourceKey, { pageIndex, searchTerm, sort }],
    queryFn: () => resource.list({ pageIndex, pageSize: PAGE_SIZE, searchTerm: searchTerm || undefined, sort }),
    placeholderData: keepPreviousData,
  });

  const toggleSort = (field: string) => {
    setPageIndex(0);
    setSort((prev) => {
      if (prev === `${field}.asc`) return `${field}.desc`;
      if (prev === `${field}.desc`) return undefined;
      return `${field}.asc`;
    });
  };

  const pagination = query.data?.pagination;
  const rows = query.data?.results ?? [];

  return (
    <Box bg="white" borderWidth="1px" borderColor="#E8ECEF" borderRadius="12px" boxShadow="0 4px 18px rgba(7, 38, 46, 0.05)" overflow="hidden">
      <Flex px={4} py={3} gap={3} align="center" borderBottomWidth="1px" borderColor="#EEF1F3" bg="white">
        {search ? (
          <Input
            size="sm"
            maxW="360px"
            borderRadius="8px"
            borderColor="#DDE3E7"
            bg="#FBFCFD"
            placeholder="Buscar registros..."
            value={searchTerm}
            onChange={(e) => {
              setPageIndex(0);
              setSearchTerm(e.target.value);
            }}
            _focusVisible={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #0474AF" }}
          />
        ) : null}
        <Spacer />
        {toolbarExtra}
        {onCreate ? (
          <Button size="sm" colorPalette="brand" borderRadius="8px" fontWeight="600" onClick={onCreate}>
            + Novo
          </Button>
        ) : null}
      </Flex>

      {query.isLoading ? (
        <LoadingScreen />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row bg="#F6F8F9">
                {columns.map((col) => (
                  <Table.ColumnHeader
                    key={col.field}
                    cursor={col.sortable ? "pointer" : undefined}
                    onClick={col.sortable ? () => toggleSort(col.field) : undefined}
                    py={3}
                    color="#52616A"
                    fontSize="11px"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                    whiteSpace="nowrap"
                  >
                    {col.label ?? col.field}
                    {sort?.startsWith(`${col.field}.`) ? (sort.endsWith(".asc") ? " ▲" : " ▼") : ""}
                  </Table.ColumnHeader>
                ))}
                {onEdit || onDelete ? (
                  <Table.ColumnHeader textAlign="end" color="#52616A" fontSize="11px" fontWeight="700" textTransform="uppercase">
                    Ações
                  </Table.ColumnHeader>
                ) : null}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}>
                    <Text color="gray.400" py={10} textAlign="center">
                      Nenhum registro encontrado.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((row, idx) => (
                  <Table.Row key={(row._id as string) ?? idx} _hover={{ bg: "#F8FCFF" }}>
                    {columns.map((col) => (
                      <Table.Cell key={col.field} py="11px" color="#33434C" fontSize="13px" whiteSpace="nowrap">
                        {renderCell(row[col.field], col.kind)}
                      </Table.Cell>
                    ))}
                    {onEdit || onDelete ? (
                      <Table.Cell textAlign="end" py="8px">
                        <Flex gap={1} justify="end">
                          {onEdit ? (
                            <Button size="xs" variant="ghost" colorPalette="brand" borderRadius="7px" onClick={() => onEdit(row)}>
                              Editar
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button size="xs" variant="ghost" colorPalette="red" borderRadius="7px" onClick={() => onDelete(row)}>
                              Excluir
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

      {pagination ? (
        <Flex px={4} py={3} align="center" gap={3} borderTopWidth="1px" borderColor="#EEF1F3" bg="#FCFDFD">
          <Text fontSize="12px" color="gray.500">
            {pagination.totalItems} registro(s) · página {pagination.currentPage} de {pagination.totalPages}
          </Text>
          <Spacer />
          <Button size="xs" variant="outline" borderRadius="7px" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="7px"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => setPageIndex((p) => p + 1)}
          >
            Próxima
          </Button>
        </Flex>
      ) : null}
    </Box>
  );
}
