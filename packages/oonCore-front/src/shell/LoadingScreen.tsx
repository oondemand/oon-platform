import { Button, Flex, Spinner, Text } from "@chakra-ui/react";

interface LoadingScreenProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Tela de carregamento/estado neutro reutilizada por guards e Suspense. */
export function LoadingScreen({
  message,
  actionLabel,
  onAction,
}: LoadingScreenProps) {
  return (
    <Flex direction="column" align="center" justify="center" minH="60vh" gap={4}>
      <Spinner size="lg" />
      {message ? (
        <Text color="gray.500" fontSize="sm" textAlign="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Flex>
  );
}
