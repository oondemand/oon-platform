const { defineRoutes, registry } = require("@oondemand/oon-core-back");

/**
 * Rota customizada de domínio. Usa o contrato de segurança do Core:
 * `router.private` aplica auth + RBAC automaticamente — nunca um
 * `express.Router()` cru.
 */
defineRoutes("/relatorios", (router) => {
  router.private.get("/resumo", { roles: ["admin"] }, async (_req, res) => {
    const counts = {};
    for (const entry of registry.listModels()) {
      counts[entry.name] = await entry.mongooseModel.countDocuments();
    }
    res.json({ resumo: counts });
  });
});
