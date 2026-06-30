import { Box, Button, Flex, Spacer, Text } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import type { OonAppConfig, OonMenuItem } from "../types";
import { useOonAuth } from "../security/AuthProvider";
import { Sidebar } from "./Sidebar";

/** Layout autenticado padrão: sidebar compacta, topbar fixa e área operacional. */
export function AuthenticatedLayout({ app, menu }: { app: OonAppConfig; menu: OonMenuItem[] }) {
  const { user, logout } = useOonAuth();

  return (
    <Flex align="stretch" minH="100vh" bg="#F8F9FA">
      <Sidebar app={app} menu={menu} />
      <Flex direction="column" flex="1" minW={0}>
        <Flex
          as="header"
          align="center"
          minH="64px"
          px={{ base: 4, lg: 6 }}
          py={3}
          borderBottomWidth="1px"
          borderColor="#E8ECEF"
          bg="rgba(255, 255, 255, 0.96)"
          backdropFilter="blur(10px)"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Box>
            <Text fontSize="xs" fontWeight="600" color="brand.500" textTransform="uppercase" letterSpacing="0.08em">
              Central Oon
            </Text>
            <Text fontSize="sm" fontWeight="600" color="#24323A">
              {app.title ?? app.name}
            </Text>
          </Box>
          <Spacer />
          {user ? (
            <Flex align="center" gap={3}>
              <Box textAlign="right" display={{ base: "none", md: "block" }}>
                <Text fontSize="sm" fontWeight="600" color="#24323A">
                  {user.nome}
                </Text>
                {user.email ? (
                  <Text fontSize="xs" color="gray.500">
                    {user.email}
                  </Text>
                ) : null}
              </Box>
              <Button size="sm" variant="outline" colorPalette="brand" borderRadius="8px" onClick={logout}>
                Sair
              </Button>
            </Flex>
          ) : null}
        </Flex>
        <Box as="main" flex="1" p={{ base: 4, lg: 6 }} minW={0}>
          <Box maxW="1680px" mx="auto">
            <Outlet />
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
