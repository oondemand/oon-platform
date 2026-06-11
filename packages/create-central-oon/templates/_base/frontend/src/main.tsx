import { startFromManifest } from "@oondemand/oon-core-front";
import manifest from "../central.ui.json";

/**
 * Toda a Central __NAME__ inicia por aqui. Sem providers, router, auth, layout
 * ou páginas — só o manifesto declarativo `central.ui.json`. O Core resolve as
 * telas a partir do `/core/metadata` do backend.
 */
startFromManifest(manifest, {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  meusAppsUrl: import.meta.env.VITE_MEUS_APPS_URL,
});
