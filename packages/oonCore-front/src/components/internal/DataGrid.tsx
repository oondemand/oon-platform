import { useState, type ReactNode } from "react";
import { Box, Button, Flex, Input, Spacer, Table, Text } from "@chakra-ui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { OonColumnDef } from "../../types";
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

/**
 * Grid genérico dirigido pelo `ResourceClient`. Paginação/ordenação/busca são
 * server-side (contrato do back: pageIndex/pageSize/searchTerm/sort). Não
 * conhece nenhuma entidade específica.
 */
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
    <Box>
      <Flex mb={4} gap={3} align="center">
        {search ? (
          <Input
            size="sm"
            maxW="320px"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setPageIndex(0);
              setSearchTerm(e.target.value);
            }}
          />
        ) : null}
        <Spacer />
        {toolbarExtra}
        {onCreate ? (
          <Button size="sm" colorPalette="blue" onClick={onCreate}>
            Novo
          </Button>
        ) : null}
      </Flex>

      {query.isLoading ? (
        <LoadingScreen />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflowX="auto" bg="white">
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row>
                {columns.map((col) => (
                  <Table.ColumnHeader
                    key={col.field}
                    cursor={col.sortable ? "pointer" : undefined}
                    onClick={col.sortable ? () => toggleSort(col.field) : undefined}
                  >
                    {col.label ?? col.field}
                    {sort?.startsWith(`${col.field}.`) ? (sort.endsWith(".asc") ? " ▲" : " ▼") : ""}
                  </Table.ColumnHeader>
                ))}
                {onEdit || onDelete ? <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader> : null}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length + 1}>
                    <Text color="gray.400" py={6} textAlign="center">
                      Nenhum registro encontrado.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((row, idx) => (
                  <Table.Row key={(row._id as string) ?? idx}>
                    {columns.map((col) => (
                      <Table.Cell key={col.field}>{formatCell(row[col.field], col.kind)}</Table.Cell>
                    ))}
                    {onEdit || onDelete ? (
                      <Table.Cell textAlign="end">
                        <Flex gap={2} justify="end">
                          {onEdit ? (
                            <Button size="xs" variant="ghost" onClick={() => onEdit(row)}>
                              Editar
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button size="xs" variant="ghost" colorPalette="red" onClick={() => onDelete(row)}>
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
        <Flex mt={4} align="center" gap={3}>
          <Text fontSize="sm" color="gray.500">
            {pagination.totalItems} registro(s) · página {pagination.currentPage} de {pagination.totalPages}
          </Text>
          <Spacer />
          <Button size="xs" variant="outline" disabled={pageIndex <= 0} onClick={() => setPageIndex((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            size="xs"
            variant="outline"
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
