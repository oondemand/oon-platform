import {
  defineCollectionView,
  defineDashboard,
  definePipelineView,
  type OonCoreFrontConfig,
} from "@oondemand/oon-core-front";

/**
 * Declaração de UI da Central Exemplo (equivalente ao central.ui.json da
 * Seção 9). Nenhuma página é escrita à mão: cada view é renderizada por um
 * componente Core dirigido pela metadata do back (/core/*).
 *
 * Critério de pronto da Fase 3 (Seção 6): a coleção `Cotacao` em
 * `mode: "dynamic"` sobe a tela completa só com `defineModel` no back.
 */
export const appConfig: OonCoreFrontConfig = {
  app: {
    id: "central-exemplo",
    name: "Central Exemplo",
    title: "Central Exemplo · oonCore",
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
    meusAppsUrl: import.meta.env.VITE_MEUS_APPS_URL,
    versionPrefix: "",
  },
  auth: {
    mode: "bearer",
    tokenParam: "code",
  },
  security: {
    enableRouteGuard: true,
    enablePermissionGate: true,
    redactAssistantContext: true,
    disableConsoleInProduction: true,
  },
  ui: {
    views: [
      defineDashboard({
        path: "/",
        label: "Visão geral",
        widgets: [
          { id: "pessoas", label: "Prestadores", model: "Pessoa", kind: "count" },
          { id: "servicos", label: "Serviços", model: "Servico", kind: "count" },
          { id: "cotacoes", label: "Cotações", model: "Cotacao", kind: "count" },
        ],
      }),

      // 100% dinâmico: sem colunas nem form — tudo vem de /core/models/Cotacao.
      defineCollectionView({ model: "Cotacao", mode: "dynamic", section: "Cadastros" }),

      // Registro mínimo: só model + label; Core deriva grid/form da metadata.
      defineCollectionView({ model: "Pessoa", label: "Prestadores", mode: "minimal", section: "Cadastros" }),

      // Esteira derivada do enum `statusProcessamento` da model Servico.
      definePipelineView({
        model: "Servico",
        label: "Serviços tomados",
        stageField: "statusProcessamento",
        section: "Operação",
      }),
    ],
  },
};
