const ctx = require("../core/context");
const { connectDB } = require("./database");
const { createApp } = require("./createApp");
const { loadCentral } = require("./loadCentral");

/**
 * Sobe a aplicação completa: carrega a Central do consumidor, conecta no
 * banco, monta a app e escuta a porta. É o `start` da API pública e o
 * alvo do `oonCore-back start`.
 *
 * @param {{ cwd?: string, listen?: boolean }} opts
 */
async function start({ cwd = process.cwd(), listen = true } = {}) {
  loadCentral(cwd);
  await connectDB();
  const app = createApp();

  if (!listen) return { app };

  const port = ctx.config.port;
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log("****************************************************************");
      console.log(`${ctx.config.serviceName} rodando na porta ${port} e conectado ao MongoDB`);
      console.log("****************************************************************");
      resolve({ app, server });
    });
  });
}

module.exports = { start };
