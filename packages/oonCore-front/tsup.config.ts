import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react-router-dom",
    "@chakra-ui/react",
    "@tanstack/react-query",
    "@tanstack/react-table",
  ],
});
