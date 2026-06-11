/**
 * Estado de runtime do Core. Singleton de processo: guarda a config da
 * Central resolvida no boot e dá acesso aos registries para as factories,
 * rotas /core/* e CLI.
 */
const defaults = {
  serviceName: process.env.SERVICE_NAME || "central-oon",
  serviceVersion: process.env.SERVICE_VERSION || "0.0.0",
  port: Number(process.env.PORT) || 4000,
  // Função de verificação de token. Recebe (token, { sistema }) e deve
  // resolver com o objeto `usuario` ({ tipo, nome, email }) ou lançar.
  // Default: delega ao Meus Apps (comportamento histórico do CST).
  auth: { verifyToken: null },
  cors: { origin: "*" },
};

let config = { ...defaults };

module.exports = {
  get config() {
    return config;
  },
  setConfig(partial = {}) {
    config = {
      ...config,
      ...partial,
      auth: { ...config.auth, ...(partial.auth || {}) },
      cors: { ...config.cors, ...(partial.cors || {}) },
    };
    return config;
  },
  reset() {
    config = { ...defaults };
  },
};
