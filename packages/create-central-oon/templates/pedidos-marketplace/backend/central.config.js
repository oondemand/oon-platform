/**
 * Central __NAME__ — template pedidos-marketplace. Catálogo de produtos +
 * esteira de pedidos.
 */
module.exports = {
  name: "__NAME__",
  slug: "__SLUG__",

  modules: {
    collections: true,
    documents: false,
    pipelines: true,
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
