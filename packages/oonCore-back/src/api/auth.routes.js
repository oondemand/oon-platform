const express = require("express");
const axios = require("axios");
const auth = require("../core/middlewares/auth");
const GenericError = require("../core/errors/GenericError");
const { asyncHandler, sendResponse } = require("../core/utils/helpers");

const router = express.Router();

function getActivationBaseUrl() {
  const value =
    process.env.CENTRAL_ATIVACAO_URL || process.env.MEUS_APPS_BACKEND_URL;

  if (!value) {
    throw new GenericError("CENTRAL_ATIVACAO_URL não configurada.", {
      statusCode: 500,
    });
  }

  return value.replace(/\/$/, "");
}

function readBasicAuthorization(req) {
  const authorization = String(req.headers.authorization || "");
  if (!authorization.startsWith("Basic ")) {
    throw new GenericError("Credenciais de autenticação ausentes.", {
      statusCode: 401,
    });
  }
  return authorization;
}

function translateProviderError(error, fallbackMessage) {
  const statusCode = error.response?.status || error.statusCode || 502;
  const providerMessage = error.response?.data?.message;

  return new GenericError(providerMessage || fallbackMessage, {
    statusCode,
    details: error.response?.data?.error || null,
  });
}

/**
 * Login local da Central consumidora. O frontend envia apenas Basic Auth; o
 * backend delega a validação das credenciais à Central de Ativações.
 */
router.post(
  "/autenticar",
  asyncHandler(async (req, res) => {
    const authorization = readBasicAuthorization(req);

    try {
      const response = await axios.post(
        `${getActivationBaseUrl()}/auth/autenticar`,
        {},
        {
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
          },
        },
      );

      res.set("Cache-Control", "no-store");
      res.status(response.status).json(response.data);
    } catch (error) {
      throw translateProviderError(error, "Não foi possível autenticar o usuário.");
    }
  }),
);

/**
 * Valida o token e, pelo middleware do Core, confirma se o usuário possui
 * permissão ativa para o aplicativo configurado no backend.
 */
router.get(
  "/validar-token",
  auth,
  asyncHandler(async (req, res) => {
    sendResponse({ res, statusCode: 200, usuario: req.usuario });
  }),
);

module.exports = router;
