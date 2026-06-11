import { Badge, Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useCoreMetadata, useOonApi } from "../api/ApiProvider";
import { LoadingScreen } from "../shell/LoadingScreen";
import { ErrorState } from "../shell/ErrorState";

export interface CoreIntegrationProps {
  label?: string;
}

interface IntegrationEntry {
  id?: string;
  name?: string;
  label?: string;
  status?: string;
}

/**
 * Painel de integrações: lista o que o back declarou em /core/integrations e
 * permite reprocessar via action RESTful (POST /integrations/actions/process-active).
 */
export function CoreIntegration({ label = "Integrações" }: CoreIntegrationProps) {
  const { http } = useOonApi();
  const metadata = useCoreMetadata();

  const reprocess = useMutation({
    mutationFn: () =>
      http.post("/integrations/actions/process-active", {}, { headers: { "x-oon-origin": "integration" } }),
  });

  if (metadata.isLoading) return <LoadingScreen />;
  if (metadata.isError) return <ErrorState error={metadata.error} />;

  const integrations = (metadata.data?.integrations ?? []) as IntegrationEntry[];

  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between">
        <Heading size="lg">{label}</Heading>
        <Button size="sm" variant="outline" loading={reprocess.isPending} onClick={() => reprocess.mutate()}>
          Reprocessar ativos
        </Button>
      </Flex>
      <Stack gap={3}>
        {integrations.length === 0 ? (
          <Text color="gray.400">Nenhuma integração declarada.</Text>
        ) : (
          integrations.map((it, idx) => (
            <Box
              key={it.id ?? it.name ?? idx}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              p={4}
            >
              <Flex align="center" justify="space-between">
                <Text fontWeight="medium">{it.label ?? it.name ?? "Integração"}</Text>
                <Badge colorPalette={it.status === "erro" ? "red" : it.status === "ativo" ? "green" : "gray"}>
                  {it.status ?? "—"}
                </Badge>
              </Flex>
            </Box>
          ))
        )}
      </Stack>
    </Stack>
  );
}
