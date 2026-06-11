/**
 * Central __NAME__ — template multi-moedas. Liga o módulo de moedas do Core
 * (cotações, conversão).
 */
module.exports = {
  name: "__NAME__",
  slug: "__SLUG__",

  modules: {
    collections: true,
    documents: false,
    pipelines: false,
    integrations: false,
    omie: false,
    assistants: false,
    currencies: true,
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
