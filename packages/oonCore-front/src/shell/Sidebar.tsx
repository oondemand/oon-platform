import { Box, Flex, Image, Stack, Text } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import type { OonAppConfig, OonMenuItem } from "../types";
import { useOonAuth } from "../security/AuthProvider";

function groupBySection(items: OonMenuItem[]): Array<[string, OonMenuItem[]]> {
  const groups = new Map<string, OonMenuItem[]>();
  for (const item of items) {
    const section = item.section ?? "Geral";
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section)!.push(item);
  }
  return Array.from(groups.entries());
}

/** Menu lateral compacto e agrupado, seguindo o padrão operacional Minexco. */
export function Sidebar({ app, menu }: { app: OonAppConfig; menu: OonMenuItem[] }) {
  const { hasPermission } = useOonAuth();
  const visible = menu.filter((item) => hasPermission(item.permissions));

  return (
    <Box
      as="nav"
      w={{ base: "76px", lg: "248px" }}
      minH="100vh"
      borderRightWidth="1px"
      borderColor="#E8ECEF"
      px={{ base: 2, lg: 3 }}
      py={4}
      bg="white"
      position="sticky"
      top={0}
      alignSelf="flex-start"
      overflowY="auto"
    >
      <Flex align="center" gap={3} mb={6} px={{ base: 1, lg: 2 }} minH="42px">
        {app.logo ? (
          <Image src={app.logo} alt={app.name} maxH="36px" maxW={{ base: "44px", lg: "150px" }} objectFit="contain" />
        ) : (
          <Flex
            w="38px"
            h="38px"
            flex="0 0 auto"
            borderRadius="12px"
            align="center"
            justify="center"
            bg="brand.500"
            color="white"
            fontWeight="700"
            fontSize="lg"
          >
            O
          </Flex>
        )}
        <Box display={{ base: "none", lg: "block" }} minW={0}>
          <Text fontWeight="700" fontSize="sm" color="#07262E" lineClamp={1}>
            {app.name}
          </Text>
          <Text fontSize="10px" color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
            Operação digital
          </Text>
        </Box>
      </Flex>

      <Stack gap={5}>
        {groupBySection(visible).map(([section, items]) => (
          <Stack key={section} gap={1}>
            <Text
              display={{ base: "none", lg: "block" }}
              fontSize="10px"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="0.08em"
              px={3}
              mb={1}
            >
              {section}
            </Text>
            {items.map((item) => (
              <NavLink key={item.href} to={item.href} end={item.href === "/"} title={item.label}>
                {({ isActive }) => (
                  <Flex
                    align="center"
                    justify={{ base: "center", lg: "flex-start" }}
                    gap={3}
                    px={{ base: 2, lg: 3 }}
                    py="10px"
                    borderRadius="9px"
                    fontSize="13px"
                    fontWeight={isActive ? "600" : "500"}
                    bg={isActive ? "brand.50" : "transparent"}
                    color={isActive ? "brand.700" : "#46545C"}
                    borderLeftWidth="3px"
                    borderLeftColor={isActive ? "brand.500" : "transparent"}
                    transition="all 0.15s ease"
                    _hover={{ bg: isActive ? "brand.50" : "#F8F9FA", color: "brand.700" }}
                  >
                    {item.icon ? <Box flex="0 0 auto">{item.icon}</Box> : <Box w="7px" h="7px" borderRadius="full" bg={isActive ? "brand.500" : "gray.300"} />}
                    <Text display={{ base: "none", lg: "block" }} lineClamp={1}>
                      {item.label}
                    </Text>
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
