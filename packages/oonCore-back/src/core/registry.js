/**
 * Model Registry — coração técnico do Core (Seção 17).
 *
 * Tudo que o dev declara via `define*` é registrado aqui. A partir do
 * registry, o Core deriva: schemas Mongoose, CRUD, RBAC, OpenAPI/metadata,
 * rotas /core/* e os hooks dos módulos opinativos.
 *
 * É um singleton de processo. `reset()` existe para testes.
 */
const store = {
  models: new Map(), // name -> { name, mongooseModel, definition }
  validations: new Map(), // modelName -> validateFn
  triggers: new Map(), // modelName -> { before, after }
  routes: [], // [{ basePath, build }]
  collections: new Map(),
  documents: new Map(),
  pipelines: new Map(),
  omieMappings: new Map(),
  integrations: new Map(),
  menus: [],
  features: new Map(),
};

function registerModel(entry) {
  if (store.models.has(entry.name)) {
    throw new Error(`Model "${entry.name}" já registrada no Core.`);
  }
  store.models.set(entry.name, entry);
  return entry;
}

function getModel(name) {
  return store.models.get(name);
}

function listModels() {
  return [...store.models.values()];
}

function registerValidation(modelName, fn) {
  store.validations.set(modelName, fn);
}

function getValidation(modelName) {
  return store.validations.get(modelName);
}

function registerTrigger(modelName, hooks) {
  const current = store.triggers.get(modelName) || { before: [], after: [] };
  if (hooks.before) current.before.push(hooks.before);
  if (hooks.after) current.after.push(hooks.after);
  store.triggers.set(modelName, current);
}

function getTriggers(modelName) {
  return store.triggers.get(modelName) || { before: [], after: [] };
}

function registerRoutes(entry) {
  store.routes.push(entry);
}

function listRoutes() {
  return store.routes;
}

const simpleRegister = (mapName) => (key, value) => {
  store[mapName].set(key, value);
  return value;
};
const simpleList = (mapName) => () => [...store[mapName].values()];

function registerMenu(item) {
  store.menus.push(item);
}

function reset() {
  store.models.clear();
  store.validations.clear();
  store.triggers.clear();
  store.routes.length = 0;
  store.collections.clear();
  store.documents.clear();
  store.pipelines.clear();
  store.omieMappings.clear();
  store.integrations.clear();
  store.menus.length = 0;
  store.features.clear();
}

module.exports = {
  store,
  registerModel,
  getModel,
  listModels,
  registerValidation,
  getValidation,
  registerTrigger,
  getTriggers,
  registerRoutes,
  listRoutes,
  registerCollection: simpleRegister("collections"),
  listCollections: simpleList("collections"),
  registerDocument: simpleRegister("documents"),
  listDocuments: simpleList("documents"),
  registerPipeline: simpleRegister("pipelines"),
  listPipelines: simpleList("pipelines"),
  registerOmieMapping: simpleRegister("omieMappings"),
  listOmieMappings: simpleList("omieMappings"),
  registerIntegration: simpleRegister("integrations"),
  listIntegrations: simpleList("integrations"),
  registerFeature: simpleRegister("features"),
  listFeatures: simpleList("features"),
  registerMenu,
  listMenus: () => store.menus,
  reset,
};
