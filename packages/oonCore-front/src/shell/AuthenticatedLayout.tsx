import { Box, Button, Flex, Spacer, Text } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import type { OonAppConfig, OonMenuItem } from "../types";
import { useOonAuth } from "../security/AuthProvider";
import { Sidebar } from "./Sidebar";

/**
 * Layout autenticado do Core: sidebar + topbar com usuário e logout.
 * Totalmente orientado por `appConfig` e pelo menu resolvido do registry.
 */
export function AuthenticatedLayout({ app, menu }: { app: OonAppConfig; menu: OonMenuItem[] }) {
  const { user, logout } = useOonAuth();

  return (
    <Flex align="stretch" minH="100vh" bg="gray.50">
      <Sidebar app={app} menu={menu} />
      <Flex direction="column" flex="1" minW={0}>
        <Flex as="header" align="center" px={6} py={3} borderBottomWidth="1px" borderColor="gray.200" bg="white">
          <Text fontSize="sm" color="gray.500">
            {app.title ?? app.name}
          </Text>
          <Spacer />
          {user ? (
            <Flex align="center" gap={3}>
              <Text fontSize="sm" color="gray.700">
                {user.nome}
              </Text>
              <Button size="xs" variant="outline" colorPalette="brand" onClick={logout}>
                Sair
              </Button>
            </Flex>
          ) : null}
        </Flex>
        <Box as="main" flex="1" p={6} minW={0}>
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
