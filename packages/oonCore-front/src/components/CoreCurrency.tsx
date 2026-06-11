import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OonColumnDef } from "../types";
import { useOonApi } from "../api/ApiProvider";
import { CoreCollection } from "./CoreCollection";

export interface CoreCurrencyProps {
  /** model das moedas. Default: "Moeda". */
  model?: string;
  label?: string;
  endpoint?: string;
  columns?: OonColumnDef[];
}

/**
 * Multi-moedas (módulo de domínio, Seção 4.6/2.11). Lista as moedas e expõe a
 * ação RESTful de atualizar cotações (POST /<endpoint>/actions/update-rates).
 */
export function CoreCurrency({ model = "Moeda", label = "Multi-moedas", endpoint = "/moedas", columns }: CoreCurrencyProps) {
  const { http } = useOonApi();
  const queryClient = useQueryClient();

  const updateRates = useMutation({
    mutationFn: () => http.post(`${endpoint}/actions/update-rates`, {}, { headers: { "x-oon-origin": "integration" } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oon", "list", endpoint] }),
  });

  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between">
        <Heading size="lg">{label}</Heading>
        <Button size="sm" colorPalette="blue" loading={updateRates.isPending} onClick={() => updateRates.mutate()}>
          Atualizar cotações
        </Button>
      </Flex>
      {updateRates.isError ? (
        <Text fontSize="sm" color="red.600">
          {updateRates.error?.message}
        </Text>
      ) : null}
      <CoreCollection model={model} label="" mode={columns ? "full" : "dynamic"} endpoint={endpoint} columns={columns} />
    </Stack>
  );
}
