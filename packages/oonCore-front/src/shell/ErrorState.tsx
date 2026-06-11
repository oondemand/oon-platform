import { Box, Heading, Text } from "@chakra-ui/react";

/**
 * Estado de erro padrão. Aceita tanto o `OonError` do client quanto um `Error`
 * cru (o que o React Query tipa em `query.error`) — só precisa de `message` e,
 * opcionalmente, `requestId`.
 */
export function ErrorState({
  error,
  title = "Não foi possível carregar",
}: {
  error?: { message?: string; requestId?: string } | null;
  title?: string;
}) {
  return (
    <Box borderWidth="1px" borderColor="red.200" bg="red.50" borderRadius="md" p={4}>
      <Heading size="sm" color="red.700">
        {title}
      </Heading>
      <Text mt={1} fontSize="sm" color="red.600">
        {error?.message ?? "Erro inesperado."}
      </Text>
      {error?.requestId ? (
        <Text mt={2} fontSize="xs" color="red.400">
          requestId: {error.requestId}
        </Text>
      ) : null}
    </Box>
  );
}
