const GenericError = require("../errors/GenericError");

/**
 * Gera um service de CRUD genérico para uma model registrada.
 * Cobre paginação, filtros, busca textual, ordenação, import e export.
 */
function createCrudService(entry) {
  const { mongooseModel: Model, searchableFields } = entry;

  async function listPaginated({ pageIndex = 0, pageSize = 20, searchTerm, sort, filtros = {} } = {}) {
    const page = Math.max(0, Number(pageIndex) || 0);
    const limit = Math.min(200, Math.max(1, Number(pageSize) || 20));

    const query = { ...cleanFilters(filtros) };
    if (searchTerm && searchableFields.length) {
      const rx = new RegExp(escapeRegex(searchTerm), "i");
      query.$or = searchableFields.map((f) => ({ [f]: rx }));
    }

    const sortSpec = parseSort(sort);
    const [results, totalItems] = await Promise.all([
      Model.find(query).sort(sortSpec).skip(page * limit).limit(limit).lean(),
      Model.countDocuments(query),
    ]);

    return {
      results,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
  }

  async function getById(id) {
    const doc = await Model.findById(id);
    if (!doc) throw new GenericError("Registro não encontrado.", { statusCode: 404 });
    return doc;
  }

  async function create(data) {
    return Model.create(data);
  }

  async function update(id, data) {
    const doc = await Model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new GenericError("Registro não encontrado.", { statusCode: 404 });
    return doc;
  }

  async function remove(id) {
    const doc = await Model.findByIdAndDelete(id);
    if (!doc) throw new GenericError("Registro não encontrado.", { statusCode: 404 });
    return doc;
  }

  async function importMany(rows = []) {
    if (!Array.isArray(rows)) {
      throw new GenericError("Esperado um array de registros.", { statusCode: 400 });
    }
    const docs = await Model.insertMany(rows, { ordered: false });
    return { inserted: docs.length };
  }

  async function exportAll(filtros = {}) {
    return Model.find(cleanFilters(filtros)).lean();
  }

  return { listPaginated, getById, create, update, remove, importMany, exportAll };
}

function cleanFilters(filtros) {
  const out = {};
  for (const [k, v] of Object.entries(filtros || {})) {
    if (v !== undefined && v !== "" && v !== null) out[k] = v;
  }
  return out;
}

function parseSort(sort) {
  if (!sort) return { createdAt: -1 };
  // "campo:asc" | "campo:desc" | "campo"
  const [field, dir] = String(sort).split(":");
  return { [field]: dir === "asc" ? 1 : -1 };
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { createCrudService };
