const express = require("express");
const { asyncHandler } = require("../utils/helpers");
const auth = require("../middlewares/auth");
const { rbac } = require("../middlewares/rbac");
const { mutationAudit } = require("../middlewares/mutationAudit");
const { createCrudService } = require("./crudService");
const { createCrudController } = require("./crudController");

/**
 * Monta o router de CRUD de uma model. Todas as rotas são privadas
 * (auth obrigatório). Mutações passam por RBAC + mutationAudit.
 *
 * Endpoints (Seção 2.9): GET list, GET :id, POST, PUT :id, PATCH :id,
 * DELETE :id, POST /import, GET /export.
 */
function buildModelRouter(entry) {
  const router = express.Router();
  const service = createCrudService(entry);
  const controller = createCrudController(entry, service);

  const crud = entry.definition.crud || {};
  const roles = crud.roles || {};
  const readRoles = roles.read || [];
  const writeRoles = roles.write || [];
  const entidade = entry.name;

  router.use(auth);

  router.get("/", rbac(readRoles), asyncHandler(controller.list));
  router.get("/export", rbac(readRoles), asyncHandler(controller.exportAll));
  router.get("/:id", rbac(readRoles), asyncHandler(controller.getById));

  router.post(
    "/import",
    rbac(writeRoles),
    mutationAudit({ entidade, acao: "adicionado" }),
    asyncHandler(controller.importMany)
  );
  router.post(
    "/",
    rbac(writeRoles),
    mutationAudit({ entidade, acao: "adicionado" }),
    asyncHandler(controller.create)
  );
  router.put(
    "/:id",
    rbac(writeRoles),
    mutationAudit({ entidade, acao: "alterado" }),
    asyncHandler(controller.update)
  );
  router.patch(
    "/:id",
    rbac(writeRoles),
    mutationAudit({ entidade, acao: "alterado" }),
    asyncHandler(controller.patch)
  );
  router.delete(
    "/:id",
    rbac(writeRoles),
    mutationAudit({ entidade, acao: "excluido" }),
    asyncHandler(controller.remove)
  );

  return router;
}

module.exports = { buildModelRouter };
