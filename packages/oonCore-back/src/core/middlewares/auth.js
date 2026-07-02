const axios = require("axios");
const Helpers = require("../utils/helpers");
const ctx = require("../context");
const {
  PERMISSION_PATH,
  getBaseUrl,
  getAppCode,
  getTimeout,
} = require("../utils/activationProvider");

async function defaultVerifyToken(token, context = {}) {
  const baseUrl = getBaseUrl(context.req);
  const appCode = getAppCode();

  try {
    const headers = {
      "x-app-code": appCode,
      Authorization: `Bearer ${token}`,
    };
    const response = await axios.get(`${baseUrl}${PERMISSION_PATH}`, {
      headers,
      timeout: getTimeout(),
      maxRedirects: 0,
    });

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
    const timedOut = error.code === "ECONNABORTED";
    const translated = new Error(
      error.response?.data?.message ||
        (timedOut
          ? "A Central de Ativações não respondeu dentro do prazo."
          : "Não foi possível validar a permissão do aplicativo."),
    );
    translated.statusCode = timedOut ? 504 : error.response?.status || 502;
    throw translated;
  }
}

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
    const statusCode = error.statusCode || error.response?.status || 502;
    const message =
      statusCode === 403
        ? "Usuário sem permissão para acessar este aplicativo."
        : statusCode === 401
          ? "Token inválido ou expirado."
          : error.message || "Erro ao validar autenticação e permissão do aplicativo.";

    return Helpers.sendErrorResponse({ res, message, statusCode });
  }
};

module.exports = authMiddleware;
module.exports.defaultVerifyToken = defaultVerifyToken;
