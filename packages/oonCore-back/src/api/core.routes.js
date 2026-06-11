const express = require("express");
const registry = require("../core/registry");
const ctx = require("../core/context");

/**
 * Rotas /core/* — contrato de metadata com o oonCore-front (Seção 2.5/21).
 * Expõem o que o registry conhece, sem domínio hardcoded.
 */
const router = express.Router();

function modelSummary(entry) {
  return {
    name: entry.name,
    singular: entry.singular,
    // basePath em que o CRUD está montado — consumido pelo oonCore-front para
    // resolver a URL do recurso no modo "dynamic" (default = /<singular>s).
    basePath: entry.definition.basePath || `/${entry.singular}s`,
    crud: entry.definition.crud?.enabled !== false,
    roles: entry.definition.crud?.roles || {},
    fields: Object.values(entry.metaFields),
    searchable: entry.searchableFields,
  };
}

router.get("/metadata", (_req, res) => {
  res.json({
    service: { name: ctx.config.serviceName, version: ctx.config.serviceVersion },
    models: registry.listModels().map(modelSummary),
    collections: registry.listCollections(),
    documents: registry.listDocuments(),
    pipelines: registry.listPipelines(),
    integrations: registry.listIntegrations(),
    features: registry.listFeatures(),
    menus: registry.listMenus(),
  });
});

router.get("/models", (_req, res) => {
  res.json({ results: registry.listModels().map(modelSummary) });
});

router.get("/models/:name", (req, res) => {
  const entry = registry.getModel(req.params.name);
  if (!entry) return res.status(404).json({ message: "Model não registrada." });
  res.json(modelSummary(entry));
});

router.get("/collections", (_req, res) => res.json({ results: registry.listCollections() }));
router.get("/documents", (_req, res) => res.json({ results: registry.listDocuments() }));
router.get("/pipelines", (_req, res) => res.json({ results: registry.listPipelines() }));
router.get("/integrations", (_req, res) => res.json({ results: registry.listIntegrations() }));

router.get("/permissions", (_req, res) => {
  const permissions = registry.listModels().flatMap((entry) => {
    const roles = entry.definition.crud?.roles || {};
    return [
      { resource: entry.name, action: "read", roles: roles.read || [] },
      { resource: entry.name, action: "write", roles: roles.write || [] },
    ];
  });
  res.json({ results: permissions });
});

router.get("/actions", (_req, res) => {
  const actions = registry.listModels().map((entry) => ({
    model: entry.name,
    actions: ["list", "getById", "create", "update", "patch", "delete", "import", "export"],
  }));
  res.json({ results: actions });
});

router.get("/menus", (_req, res) => res.json({ results: registry.listMenus() }));
router.get("/features", (_req, res) => res.json({ results: registry.listFeatures() }));

module.exports = router;
