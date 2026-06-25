import { Box, Flex, Image, Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import type { OonAppConfig, OonMenuItem } from "../types";
import { useOonAuth } from "../security/AuthProvider";

/** Agrupa itens de menu por seção, preservando ordem de inserção. */
function groupBySection(items: OonMenuItem[]): Array<[string, OonMenuItem[]]> {
  const groups = new Map<string, OonMenuItem[]>();
  for (const item of items) {
    const section = item.section ?? "";
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(item);
  }
  return Array.from(groups.entries());
}

/**
 * Menu lateral dirigido pelo registry. Esconde itens sem permissão (UX).
 * Nada de label/itens hardcoded: tudo vem de `appConfig` e do menu resolvido.
 */
export function Sidebar({ app, menu }: { app: OonAppConfig; menu: OonMenuItem[] }) {
  const { hasPermission } = useOonAuth();
  const visible = menu.filter((item) => hasPermission(item.permissions));

  return (
    <Box as="nav" w="260px" minH="100vh" borderRightWidth="1px" borderColor="gray.200" px={4} py={6} bg="white">
      <Flex align="center" gap={3} mb={8} px={2}>
        {app.logo ? <Image src={app.logo} alt={app.name} maxH="36px" /> : null}
        <Text fontWeight="bold" fontSize="md" color="brand.500">
          {app.name}
        </Text>
      </Flex>

      <Stack gap={6}>
        {groupBySection(visible).map(([section, items]) => (
          <Stack key={section || "_"} gap={1}>
            {section ? (
              <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" px={3} mb={1}>
                {section}
              </Text>
            ) : null}
            {items.map((item) => (
              <NavLink key={item.href} to={item.href} end={item.href === "/"}>
                {({ isActive }) => (
                  <Flex
                    align="center"
                    gap={2}
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={isActive ? "semibold" : "normal"}
                    bg={isActive ? "brand.50" : "transparent"}
                    color={isActive ? "brand.700" : "gray.700"}
                    _hover={{ bg: isActive ? "brand.50" : "gray.50" }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Flex>
                )}
              </NavLink>
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
