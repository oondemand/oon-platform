/**
 * Central __NAME__ — template omie-sidecar. Liga os módulos de integração e
 * Omie do Core. O engine de Omie (chaves, fila, retries) vive no Core; aqui só
 * declaramos o mapping de domínio.
 */
module.exports = {
  name: "__NAME__",
  slug: "__SLUG__",

  modules: {
    collections: true,
    documents: false,
    pipelines: false,
    integrations: true,
    omie: true,
    assistants: false,
    currencies: false,
  },

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
