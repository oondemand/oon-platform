const registry = require("../../core/registry");

/**
 * Módulo Esteiras (Seção 15) — executa um pipeline declarado via
 * `definePipeline`. Cada etapa é uma função `async (ctx) => ctx`.
 */
async function run(pipelineName, input = {}) {
  const def = registry.listPipelines().find((p) => p.name === pipelineName);
  if (!def) throw new Error(`Pipeline "${pipelineName}" não registrada.`);

  let ctx = { ...input };
  for (const etapa of def.stages || def.etapas || []) {
    const fn = typeof etapa === "function" ? etapa : etapa.run;
    ctx = (await fn(ctx)) || ctx;
  }
  return ctx;
}

module.exports = { run };
