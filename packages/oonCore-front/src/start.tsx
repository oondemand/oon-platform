import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import type { OonCoreFrontConfig } from "./types";
import { OonApp } from "./app/OonApp";

function validateConfig(config: OonCoreFrontConfig) {
  if (!config?.app?.id) throw new Error("oonCoreFront.start: config.app.id é obrigatório.");
  if (!config?.api?.baseUrl) throw new Error("oonCoreFront.start: config.api.baseUrl é obrigatório.");
}

function applyDocumentMeta(config: OonCoreFrontConfig) {
  if (config.app.title) document.title = config.app.title;
  if (config.app.favicon) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = config.app.favicon;
  }
}

function hardenConsole(config: OonCoreFrontConfig) {
  if (config.security?.disableConsoleInProduction && import.meta.env?.PROD) {
    const noop = () => {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
  }
}

/**
 * Ponto de entrada único de uma Central (Seção 3.2). O `main.tsx` da Central
 * só chama isto — não conhece providers, router, auth, layout nem serviços.
 *
 *   import { start } from "@oondemand/oon-core-front";
 *   import { appConfig } from "./central.ui";
 *   start(appConfig);
 */
export function start(config: OonCoreFrontConfig) {
  validateConfig(config);
  applyDocumentMeta(config);
  hardenConsole(config);

  const rootId = config.rootElementId ?? "root";
  const el = document.getElementById(rootId);
  if (!el) throw new Error(`oonCoreFront.start: elemento #${rootId} não encontrado no DOM.`);

  createRoot(el).render(
    <StrictMode>
      <OonApp config={config} />
    </StrictMode>
  );
}

/** Alias namespaced, compatível com a doc (`oonCoreFront.start`). */
export const oonCoreFront = { start };
