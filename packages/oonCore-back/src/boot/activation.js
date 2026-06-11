const ctx = require("../core/context");
const { connectDB } = require("./database");
const { loadCentral } = require("./loadCentral");
const Sistema = require("../core/models/Sistema");

/**
 * Ativação/seed da Central. Substitui o antigo seedRouter + seeds/.
 * Garante o singleton Sistema e executa o `activate` declarado em
 * `central.config.js` (se houver), passando o contexto do Core.
 */
async function activate({ cwd = process.cwd() } = {}) {
  loadCentral(cwd);
  await connectDB();

  let sistema = await Sistema.findOne();
  if (!sistema) {
    sistema = await Sistema.create({ appKey: process.env.APP_KEY });
    console.log("Sistema (singleton) criado.");
  }

  const hook = ctx.config.activate;
  if (typeof hook === "function") {
    await hook({ Sistema, sistema, registry: require("../core/registry") });
    console.log("Hook de ativação da Central executado.");
  }

  console.log("Ativação concluída.");
  return sistema;
}

module.exports = { activate };
