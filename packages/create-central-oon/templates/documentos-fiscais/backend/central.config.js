/**
 * Central __NAME__ — template documentos-fiscais. Liga o módulo de documentos
 * do Core (aprovação, anexos, status).
 */
module.exports = {
  name: "__NAME__",
  slug: "__SLUG__",

  modules: {
    collections: true,
    documents: true,
    pipelines: false,
    integrations: false,
    omie: false,
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
