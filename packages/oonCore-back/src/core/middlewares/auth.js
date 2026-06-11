const axios = require("axios");
const Sistema = require("../models/Sistema");
const Helpers = require("../utils/helpers");
const ctx = require("../context");

/**
 * Verificador padrão: delega ao Meus Apps (comportamento histórico do CST).
 * Pode ser sobrescrito via `central.config.js -> auth.verifyToken`.
 */
async function defaultVerifyToken(token) {
  const sistema = await Sistema.findOne().catch(() => null);
  const baseUrl = process.env.MEUS_APPS_BACKEND_URL;
  if (!baseUrl) {
    const err = new Error("MEUS_APPS_BACKEND_URL não configurada.");
    err.statusCode = 401;
    throw err;
  }

  const response = await axios.get(
    `${baseUrl}/auth/autenticar-aplicativo/`,
    { headers: { Authorization: `Bearer ${token}`, origin: sistema?.appKey } }
  );

  const data = response.data.usuario;
  return {
    tipo:
      data.aplicativo.tipoAcesso === "master" ? "admin" : data.aplicativo.tipoAcesso,
    nome: data.nome,
    email: data.email,
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
      statusCode: error.statusCode || 401,
    });
  }
};

module.exports = authMiddleware;
module.exports.defaultVerifyToken = defaultVerifyToken;
