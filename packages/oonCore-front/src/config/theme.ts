import { createSystem, defaultConfig, defineConfig, mergeConfigs } from "@chakra-ui/react";
import type { OonCoreFrontConfig } from "../types";

/**
 * Identidade visual padrão das Centrais Oon, consolidada a partir da Central
 * Minexco/CST: azul operacional, superfícies claras, tipografia Poppins e alta
 * densidade de informação.
 */
export const brandColors = {
  brand: {
    25: { value: "#F8FCFF" },
    50: { value: "#EEF8FD" },
    75: { value: "#E2F3FB" },
    100: { value: "#C7E8F7" },
    200: { value: "#82C8E8" },
    300: { value: "#3FA6E0" },
    350: { value: "#0F8DD0" },
    400: { value: "#0580B9" },
    500: { value: "#0474AF" },
    600: { value: "#036491" },
    700: { value: "#014364" },
    800: { value: "#073A52" },
    850: { value: "#082F3F" },
    900: { value: "#07262E" },
  },
} as const;

const oonThemeConfig = defineConfig({
  globalCss: {
    "html, body, #root": {
      minHeight: "100%",
    },
    body: {
      margin: 0,
      bg: "#F8F9FA",
      color: "#24323A",
      fontFamily: "Poppins, Inter, system-ui, sans-serif",
      fontSize: "14px",
    },
    "button, input, select, textarea": {
      fontFamily: "inherit",
    },
    "::selection": {
      bg: "#C7E8F7",
      color: "#07262E",
    },
  },
  theme: {
    tokens: {
      colors: brandColors,
      fonts: {
        body: { value: "Poppins, Inter, system-ui, sans-serif" },
        heading: { value: "Poppins, Inter, system-ui, sans-serif" },
      },
      radii: {
        oon: { value: "10px" },
      },
      shadows: {
        oon: { value: "0 8px 24px rgba(7, 38, 46, 0.08)" },
      },
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
 * Constrói o system do Chakra. O padrão Minexco é aplicado primeiro e pode ser
 * sobrescrito por uma identidade específica da Central sem reescrever o shell.
 */
export function createOonSystem(themeOverride?: OonCoreFrontConfig["theme"]) {
  const base = mergeConfigs(defaultConfig, oonThemeConfig);
  const config = themeOverride
    ? mergeConfigs(base, defineConfig(themeOverride as Parameters<typeof defineConfig>[0]))
    : base;
  return createSystem(config);
}

export const oonSystem = createOonSystem();
