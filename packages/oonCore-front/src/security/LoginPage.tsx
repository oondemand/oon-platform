import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Navigate, useLocation } from "react-router-dom";
import type { OonAppConfig, OonError } from "../types";
import { useOonAuth } from "./AuthProvider";

function safeRedirect(search: string): string {
  const value = new URLSearchParams(search).get("redirect") || "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login") || value.startsWith("/acesso-negado")) {
    return "/";
  }
  return value;
}

/** Tela de login padrão das Centrais que usam a Central de Ativações. */
export function LoginPage({ app }: { app: OonAppConfig }) {
  const { status, login } = useOonAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const redirect = safeRedirect(location.search);

  if (status === "authenticated") {
    return <Navigate to={redirect} replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/acesso-negado" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await login(email.trim(), password);
    } catch (error) {
      const authError = error as OonError;
      if (authError.status === 403) return;
      setMessage(
        authError.status === 401
          ? "E-mail ou senha inválidos."
          : authError.message || "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Flex minH="100vh" align="center" justify="center" bg="#F5F8FA" px={4}>
      <Box
        width="100%"
        maxW="440px"
        bg="white"
        borderWidth="1px"
        borderColor="#E4EBEF"
        borderRadius="18px"
        boxShadow="0 24px 70px rgba(7, 38, 46, 0.10)"
        p={{ base: 6, md: 9 }}
      >
        <form onSubmit={handleSubmit}>
          <VStack align="stretch" gap={6}>
            <Box>
              <Text
                color="#39BFED"
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.12em"
                textTransform="uppercase"
              >
                Central Oon
              </Text>
              <Heading mt={2} size="lg" color="#07262E">
                {app.title ?? app.name}
              </Heading>
              <Text mt={2} color="gray.600" fontSize="sm">
                Entre com seu usuário autorizado para acessar este aplicativo.
              </Text>
            </Box>

            <VStack align="stretch" gap={4}>
              <Box>
                <Text mb={2} fontSize="sm" fontWeight="600" color="#24323A">
                  E-mail
                </Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  required
                />
              </Box>

              <Box>
                <Text mb={2} fontSize="sm" fontWeight="600" color="#24323A">
                  Senha
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  required
                />
              </Box>
            </VStack>

            {message ? (
              <Box
                role="alert"
                borderRadius="10px"
                bg="red.50"
                color="red.700"
                px={4}
                py={3}
                fontSize="sm"
              >
                {message}
              </Box>
            ) : null}

            <Button
              type="submit"
              bg="#07262E"
              color="white"
              _hover={{ bg: "#0B3843" }}
              disabled={submitting || !email.trim() || !password}
            >
              {submitting ? "Validando acesso..." : "Entrar"}
            </Button>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
