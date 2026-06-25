import { createSystem, defaultConfig, defineConfig, mergeConfigs } from "@chakra-ui/react";
import type { OonCoreFrontConfig } from "../types";

/**
 * Paleta `brand` oondemand (portada de cst-multimoedas-frontend/styles/theming.js).
 * É o que dá à Central gerada o mesmo visual do projeto raiz: azul oondemand no
 * sidebar, estados ativos, botões e acentos — em vez do azul padrão do Chakra.
 */
export const brandColors = {
  brand: {
    25: { value: "#F5FBFF" },
    50: { value: "#F0F7FF" },
    75: { value: "#E6F2FF" },
    100: { value: "#C7E3FF" },
    200: { value: "#6CBCE8" },
    300: { value: "#3FA6E0" },
    350: { value: "#0F8DD0" },
    400: { value: "#0580B9" },
    500: { value: "#0474AF" },
    600: { value: "#036491" },
    700: { value: "#014364" },
    800: { value: "#034167" },
    850: { value: "#021D42" },
    900: { value: "#011225" },
  },
} as const;

/** Config base do Core: paleta brand + `colorPalette` default = brand. */
const oonThemeConfig = defineConfig({
  theme: {
    tokens: {
      colors: brandColors,
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.50}" },
          subtle: { value: "{colors.brand.75}" },
          emphasized: { value: "{colors.brand.600}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
  },
});

/**
 * Constrói o `system` do Chakra para o Core. Parte do `defaultConfig`, aplica a
 * identidade oondemand e, por último, mescla qualquer override vindo de
 * `config.theme` (uma Central pode trocar a paleta sem reescrever o shell).
 */
export function createOonSystem(themeOverride?: OonCoreFrontConfig["theme"]) {
  const base = mergeConfigs(defaultConfig, oonThemeConfig);
  const config = themeOverride
    ? mergeConfigs(base, defineConfig(themeOverride as Parameters<typeof defineConfig>[0]))
    : base;
  return createSystem(config);
}

/** System pronto com a identidade padrão (sem overrides). */
export const oonSystem = createOonSystem();
