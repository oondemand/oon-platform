/**
 * Configuração da Central (Seção 8). Apenas identidade, módulos ativos e
 * os paths de domínio. Sem db/auth/deploy — isso vive no Core e nas envs.
 */

/**
 * Auth de DESENVOLVIMENTO: quando DEV_FAKE_AUTH=true, qualquer token é aceito
 * e resolve um usuário admin local. Serve para rodar a stack no navegador sem
 * o provedor Meus Apps. NUNCA ligar em produção (o default volta a ser Meus
 * Apps automaticamente quando a env está ausente).
 */
const devAuth =
  process.env.DEV_FAKE_AUTH === "true"
    ? { auth: { verifyToken: async () => ({ tipo: "admin", nome: "Dev Local", email: "dev@local" }) } }
    : {};

module.exports = {
  name: "Central Exemplo",
  slug: "central-exemplo",

  // Módulos opinativos do Core ligados nesta Central.
  modules: {
    omie: true,
    currencies: true,
    assistants: false,
    documents: false,
    pipelines: false,
  },

  // Paths de domínio carregados automaticamente pelo Core no boot.
  domain: {
    models: "src/models",
    validations: "src/validations",
    triggers: "src/triggers",
    routes: "src/routes",
  },

  ...devAuth,
};
