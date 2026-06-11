import { Flex, Spinner, Text } from "@chakra-ui/react";

/** Tela de carregamento/estado neutro reutilizada por guards e Suspense. */
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <Flex direction="column" align="center" justify="center" minH="60vh" gap={4}>
      <Spinner size="lg" />
      {message ? (
        <Text color="gray.500" fontSize="sm">
          {message}
        </Text>
      ) : null}
    </Flex>
  );
}
