const Helpers = require("../utils/helpers");
const registry = require("../registry");

/**
 * Controllers HTTP de CRUD ligados a um service. Aplica validação
 * declarada via `defineValidation` antes de create/update.
 */
function createCrudController(entry, service) {
  const runValidation = async (data, op) => {
    const validate = registry.getValidation(entry.name);
    if (validate) await validate(data, { op });
  };

  return {
    async list(req, res) {
      const { pageIndex, pageSize, searchTerm, sort, ...filtros } = req.query;
      const { results, pagination } = await service.listPaginated({
        pageIndex,
        pageSize,
        searchTerm,
        sort,
        filtros,
      });
      Helpers.sendPaginatedResponse({ res, statusCode: 200, results, pagination });
    },

    async getById(req, res) {
      const registro = await service.getById(req.params.id);
      Helpers.sendResponse({ res, statusCode: 200, [entry.singular]: registro });
    },

    async create(req, res) {
      await runValidation(req.body, "create");
      const registro = await service.create(req.body);
      Helpers.sendResponse({ res, statusCode: 201, [entry.singular]: registro });
    },

    async update(req, res) {
      await runValidation(req.body, "update");
      const registro = await service.update(req.params.id, req.body);
      Helpers.sendResponse({ res, statusCode: 200, [entry.singular]: registro });
    },

    async patch(req, res) {
      const registro = await service.update(req.params.id, req.body);
      Helpers.sendResponse({ res, statusCode: 200, [entry.singular]: registro });
    },

    async remove(req, res) {
      const registro = await service.remove(req.params.id);
      Helpers.sendResponse({ res, statusCode: 200, [entry.singular]: registro });
    },

    async importMany(req, res) {
      const result = await service.importMany(req.body?.rows || req.body);
      Helpers.sendResponse({ res, statusCode: 201, ...result });
    },

    async exportAll(req, res) {
      const results = await service.exportAll(req.query);
      Helpers.sendResponse({ res, statusCode: 200, results });
    },
  };
}

module.exports = { createCrudController };
