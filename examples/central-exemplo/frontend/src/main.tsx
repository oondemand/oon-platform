import { start } from "@oondemand/oon-core-front";
import { appConfig } from "../central.ui";

/**
 * Toda a Central inicia por aqui. O main NÃO conhece providers, router, auth,
 * layout, menu nem serviços — apenas delega ao Core (Seção 3.2 / DoD item 1).
 */
start(appConfig);
