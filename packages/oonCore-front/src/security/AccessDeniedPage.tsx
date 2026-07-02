import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import type { OonAppConfig } from "../types";
import { useOonAuth } from "./AuthProvider";

/** Página exibida quando o usuário está autenticado, mas não possui o app. */
export function AccessDeniedPage({ app }: { app: OonAppConfig }) {
  const { logout } = useOonAuth();
  const navigate = useNavigate();

  function useAnotherAccount() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#F5F8FA" px={4}>
      <Box
        width="100%"
        maxW="560px"
        bg="white"
        borderWidth="1px"
        borderColor="#E4EBEF"
        borderRadius="18px"
        boxShadow="0 24px 70px rgba(7, 38, 46, 0.10)"
        p={{ base: 6, md: 10 }}
      >
        <VStack align="stretch" gap={6}>
          <Box
            width="56px"
            height="56px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="16px"
            bg="orange.50"
            color="orange.700"
            fontSize="2xl"
            fontWeight="800"
            aria-hidden="true"
          >
            !
          </Box>

          <Box>
            <Text
              color="#39BFED"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              Acesso negado
            </Text>
            <Heading mt={2} size="lg" color="#07262E">
              Você não possui permissão para este aplicativo
            </Heading>
            <Text mt={3} color="gray.600">
              Seu usuário foi autenticado, mas não existe uma permissão ativa
              para acessar {app.title ?? app.name}. Solicite o acesso ao
              administrador da sua organização.
            </Text>
          </Box>

          <Button
            alignSelf="flex-start"
            bg="#07262E"
            color="white"
            _hover={{ bg: "#0B3843" }}
            onClick={useAnotherAccount}
          >
            Entrar com outra conta
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
