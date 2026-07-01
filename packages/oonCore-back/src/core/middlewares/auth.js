const axios = require("axios");
const Helpers = require("../utils/helpers");
const ctx = require("../context");

/**
 * Verificador padrão: delega a autenticação para a Central de Ativações.
 * O código identifica a aplicação e é carregado exclusivamente do ambiente do
 * backend, evitando que o cliente escolha o app em que deseja se autenticar.
 * Pode ser sobrescrito via `central.config.js -> auth.verifyToken`.
 */
async function defaultVerifyToken(token) {
  const baseUrl = process.env.MEUS_APPS_BACKEND_URL;
  const appCode =
    process.env.APP_CODE || process.env.APP_CODIGO || process.env.APP_KEY;

  if (!baseUrl) {
    const err = new Error("MEUS_APPS_BACKEND_URL não configurada.");
    err.statusCode = 401;
    throw err;
  }

  if (!appCode) {
    const err = new Error("APP_CODE não configurada no backend.");
    err.statusCode = 500;
    throw err;
  }

  const response = await axios.get(`${baseUrl}/auth/validar-token`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-app-code": appCode,
    },
  });

  const data = response.data.usuario;
  return {
    ...data,
    tipo:
      data.tipo === "master" || data.perfil === "administrador"
        ? "admin"
        : data.tipo || data.perfil,
  };
}

/**
 * Middleware de autenticação. Sem token => 401 (invariante de segurança).
 * Resolve `req.usuario` e segue.
 */
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return Helpers.sendErrorResponse({
      res,
      message: "Acesso não autorizado. Token ausente.",
      statusCode: 401,
    });
  }

  const verify = ctx.config.auth?.verifyToken || defaultVerifyToken;

  try {
    const usuario = await verify(token, { req });
    if (!usuario) throw new Error("Usuário não resolvido.");
    req.usuario = usuario;
    next();
  } catch (error) {
    return Helpers.sendErrorResponse({
      res,
      message: "Token inválido ou erro na autenticação.",
      statusCode: error.statusCode || error.response?.status || 401,
    });
  }
};

module.exports = authMiddleware;
module.exports.defaultVerifyToken = defaultVerifyToken;
