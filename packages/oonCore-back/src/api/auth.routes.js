const express = require("express");
const axios = require("axios");
const auth = require("../core/middlewares/auth");
const GenericError = require("../core/errors/GenericError");
const {
  LOGIN_PATH,
  getBaseUrl,
  getAppCode,
  getTimeout,
} = require("../core/utils/activationProvider");
const { asyncHandler, sendResponse } = require("../core/utils/helpers");

const router = express.Router();

function readBasicAuthorization(req) {
  const authorization = String(req.headers.authorization || "");
  if (!authorization.startsWith("Basic ")) {
    throw new GenericError("Credenciais de autenticação ausentes.", {
      statusCode: 401,
    });
  }
  return authorization;
}

function translateProviderError(error) {
  if (error instanceof GenericError) return error;
  const timedOut = error.code === "ECONNABORTED";
  const statusCode = timedOut ? 504 : error.response?.status || 502;
  const message =
    error.response?.data?.message ||
    (timedOut
      ? "A Central de Ativações não respondeu dentro do prazo."
      : "Não foi possível autenticar o usuário na Central de Ativações.");
  return new GenericError(message, { statusCode });
}

router.post(
  "/autenticar",
  asyncHandler(async (req, res) => {
    const authorization = readBasicAuthorization(req);
    const baseUrl = getBaseUrl();
    const appCode = getAppCode();

    try {
      const response = await axios.post(
        `${baseUrl}${LOGIN_PATH}`,
        {},
        {
          timeout: getTimeout(),
          maxRedirects: 0,
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
            "x-app-code": appCode,
          },
        },
      );

      res.set("Cache-Control", "no-store");
      res.status(response.status).json(response.data);
    } catch (error) {
      throw translateProviderError(error);
    }
  }),
);

router.get(
  "/validar-token",
  auth,
  asyncHandler(async (req, res) => {
    sendResponse({ res, statusCode: 200, usuario: req.usuario });
  }),
);

module.exports = router;
