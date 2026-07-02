const axios = require("axios");
const Helpers = require("../utils/helpers");
const ctx = require("../context");

function getActivationBaseUrl() {
  return (
    process.env.CENTRAL_ATIVACAO_URL || process.env.MEUS_APPS_BACKEND_URL || ""
  ).replace(/\/$/, "");
}

function getAppCode() {
  return String(
    process.env.APP_CODE || process.env.APP_CODIGO || process.env.APP_KEY || "",
  )
    .trim()
    .toLowerCase();
}

/**
 * Verificador padrão: valida o token e a permissão do usuário para o app na
 * Central de Ativações. O código do app existe somente no backend.
 * Pode ser sobrescrito via `central.config.js -> auth.verifyToken`.
 */
async function defaultVerifyToken(token) {
  const baseUrl = getActivationBaseUrl();
  const appCode = getAppCode();

  if (!baseUrl) {
    const error = new Error("CENTRAL_ATIVACAO_URL não configurada.");
    error.statusCode = 500;
    throw error;
  }

  if (!appCode) {
    const error = new Error("APP_CODE não configurada no backend.");
    error.statusCode = 500;
    throw error;
  }

  try {
    const response = await axios.get(
      `${baseUrl}/auth/verificar-permissao-aplicativo`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-app-code": appCode,
        },
      },
    );

    const data = response.data?.usuario;
    if (!data) {
      const error = new Error("Usuário não retornado pela Central de Ativações.");
      error.statusCode = 502;
      throw error;
    }

    return {
      ...data,
      tipo:
        data.tipo === "master" || data.perfil === "administrador"
          ? "admin"
          : data.tipo || data.perfil,
    };
  } catch (error) {
    if (error.statusCode) throw error;

    const translated = new Error(
      error.response?.data?.message ||
        "Não foi possível validar a permissão do aplicativo.",
    );
    translated.statusCode = error.response?.status || 502;
    translated.details = error.response?.data?.error;
    throw translated;
  }
}

/**
 * Middleware de autenticação. Sem token => 401. Token válido sem permissão no
 * app => 403. Resolve `req.usuario` somente após ambas as validações.
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
    if (!usuario) {
      const error = new Error("Usuário não resolvido.");
      error.statusCode = 401;
      throw error;
    }
    req.usuario = usuario;
    next();
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status || 401;
    const message =
      statusCode === 403
        ? "Usuário sem permissão para acessar este aplicativo."
        : statusCode === 401
          ? "Token inválido ou expirado."
          : "Erro ao validar autenticação e permissão do aplicativo.";

    return Helpers.sendErrorResponse({
      res,
      message,
      statusCode,
    });
  }
};

module.exports = authMiddleware;
module.exports.defaultVerifyToken = defaultVerifyToken;
