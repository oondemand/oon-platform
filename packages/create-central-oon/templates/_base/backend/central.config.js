/**
 * Configuração da Central __NAME__ (Seção 8). Apenas identidade, módulos
 * ativos e os paths de domínio. Sem db/auth/deploy — isso vive no Core e nas
 * variáveis de ambiente.
 */
module.exports = {
  name: "__NAME__",
  slug: "__SLUG__",

  // Módulos opinativos do Core ligados nesta Central.
  modules: {
    collections: true,
    documents: false,
    pipelines: false,
    integrations: false,
    omie: false,
    assistants: false,
    currencies: false,
  },

  // Paths de domínio (carregados por convenção pelo Core no boot).
  domain: {
    models: "src/models",
    validations: "src/validations",
    triggers: "src/triggers",
    hooks: "src/hooks",
    mappings: "src/mappings",
    documents: "src/documents",
    pipelines: "src/pipelines",
    integrations: "src/integrations",
    routes: "src/routes",
  },
};
