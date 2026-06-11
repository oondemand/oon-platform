require("dotenv").config();

/**
 * API pública do @oondemand/oon-core-back (Seção 2.4).
 *
 * O consumidor escreve apenas models/validations/triggers/hooks/mappings/
 * pipelines/documents/integrations/routes e sobe com `start()` ou
 * `oonCore-back start`.
 */
const { start } = require("./boot/startServer");
const { createApp } = require("./boot/createApp");
const { activate } = require("./boot/activation");
const define = require("./core/define");
const fields = require("./core/fields");
const registry = require("./core/registry");
const GenericError = require("./core/errors/GenericError");
const { omie } = require("./modules/omie");

module.exports = {
  // boot
  start,
  createApp,
  activate,

  // declaração de domínio
  defineCentral: define.defineCentral,
  defineModel: define.defineModel,
  defineCollection: define.defineCollection,
  defineDocument: define.defineDocument,
  definePipeline: define.definePipeline,
  defineOmieMapping: define.defineOmieMapping,
  defineRoutes: define.defineRoutes,
  defineValidation: define.defineValidation,
  defineTrigger: define.defineTrigger,

  // helpers
  fields,
  omie,
  GenericError,

  // avançado / introspecção
  registry,
};
