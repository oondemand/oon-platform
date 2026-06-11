const mongoose = require("mongoose");
const express = require("express");
const registry = require("./registry");
const ctx = require("./context");
const { asyncHandler } = require("./utils/helpers");
const auth = require("./middlewares/auth");
const { rbac } = require("./middlewares/rbac");
const { mutationAudit } = require("./middlewares/mutationAudit");

/**
 * Constrói o schema Mongoose a partir dos descriptors de `fields`,
 * separando o bloco `__meta` (consumido apenas por /core/metadata).
 */
function buildSchema(schemaDef, options = {}) {
  const mongooseShape = {};
  const metaFields = {};
  const searchableFields = [];

  for (const [key, descriptor] of Object.entries(schemaDef)) {
    if (descriptor && typeof descriptor === "object" && descriptor.__meta) {
      const { __meta, ...mongooseDef } = descriptor;
      mongooseShape[key] = mongooseDef;
      metaFields[key] = { name: key, ...__meta };
      if (__meta.kind === "string" && __meta.searchable) searchableFields.push(key);
    } else {
      // Descriptor cru (compatível com Mongoose puro).
      mongooseShape[key] = descriptor;
      metaFields[key] = { name: key, kind: "raw" };
    }
  }

  const schema = new mongoose.Schema(mongooseShape, {
    timestamps: true,
    ...options,
  });

  return { schema, metaFields, searchableFields };
}

/**
 * defineModel — registra a model e gera derivações automáticas
 * (schema, CRUD, RBAC, paginação, validação, auditoria, metadata).
 */
function defineModel(definition) {
  if (!definition?.name) throw new Error("defineModel requer `name`.");
  if (!definition?.schema) throw new Error(`defineModel("${definition.name}") requer \`schema\`.`);

  const { schema, metaFields, searchableFields } = buildSchema(
    definition.schema,
    definition.options
  );

  // Hooks de domínio (defineTrigger) ligados ao ciclo do documento.
  schema.pre("save", async function (next) {
    try {
      const { before } = registry.getTriggers(definition.name);
      for (const fn of before) await fn(this, { op: this.isNew ? "create" : "update" });
      next();
    } catch (err) {
      next(err);
    }
  });
  schema.post("save", async function (doc) {
    const { after } = registry.getTriggers(definition.name);
    for (const fn of after) await fn(doc, { op: "save" });
  });

  const mongooseModel =
    mongoose.models[definition.name] || mongoose.model(definition.name, schema);

  const entry = registry.registerModel({
    name: definition.name,
    singular: (definition.singular || definition.name).toLowerCase(),
    mongooseModel,
    definition,
    metaFields,
    searchableFields,
  });

  // Permissões/actions derivadas para o front.
  if (definition.crud?.enabled !== false) {
    registry.registerFeature(definition.name, {
      model: definition.name,
      crud: true,
      roles: definition.crud?.roles || {},
    });
  }

  return entry;
}

/**
 * defineCentral — declara metadados da Central (módulos ativos + paths de
 * domínio). Mescla na config de runtime.
 */
function defineCentral(config = {}) {
  ctx.setConfig(config);
  return ctx.config;
}

function defineValidation(modelName, fn) {
  registry.registerValidation(modelName, fn);
}

function defineTrigger(modelName, hooks) {
  registry.registerTrigger(modelName, hooks);
}

function defineCollection(name, config) {
  return registry.registerCollection(name, { name, ...config });
}

function defineDocument(name, config) {
  return registry.registerDocument(name, { name, ...config });
}

function definePipeline(name, config) {
  return registry.registerPipeline(name, { name, ...config });
}

function defineOmieMapping(name, config) {
  return registry.registerOmieMapping(name, { name, ...config });
}

/**
 * defineRoutes — rotas customizadas com o contrato de segurança do Core.
 * Entrega `router.private.*` (auth + RBAC + mutationAudit) e
 * `router.public.*`. NUNCA expõe `express.Router()` cru.
 */
function defineRoutes(basePath, builder) {
  const expressRouter = express.Router();

  const wrapPrivate = (method) => (path, opts = {}, handler) => {
    if (typeof opts === "function") {
      handler = opts;
      opts = {};
    }
    const chain = [auth, rbac(opts.roles || [])];
    if (["post", "put", "patch", "delete"].includes(method) && opts.audit) {
      chain.push(mutationAudit(opts.audit));
    }
    expressRouter[method](path, ...chain, asyncHandler(handler));
  };

  const wrapPublic = (method) => (path, handler) => {
    expressRouter[method](path, asyncHandler(handler));
  };

  const methods = ["get", "post", "put", "patch", "delete"];
  const router = { private: {}, public: {} };
  for (const m of methods) {
    router.private[m] = wrapPrivate(m);
    router.public[m] = wrapPublic(m);
  }

  builder(router);
  registry.registerRoutes({ basePath, expressRouter });
  return expressRouter;
}

module.exports = {
  defineModel,
  defineCentral,
  defineValidation,
  defineTrigger,
  defineCollection,
  defineDocument,
  definePipeline,
  defineOmieMapping,
  defineRoutes,
};
