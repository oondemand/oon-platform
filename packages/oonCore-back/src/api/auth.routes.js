const express = require("express");
const axios = require("axios");
const auth = require("../core/middlewares/auth");
const { asyncHandler, sendResponse } = require("../core/utils/helpers");

/**
 * Rotas de autenticação do Core. O login e a validação do token são delegados
 * à Central de Ativações, mantendo o código do app somente no backend.
 */
const router = express.Router();

router.post(
  "/autenticar",
  asyncHandler(async (req, res) => {
    const baseUrl = process.env.MEUS_APPS_BACKEND_URL;
    const appCode =
      process.env.APP_CODE || process.env.APP_CODIGO || process.env.APP_KEY;

    if (!baseUrl) {
      const error = new Error("MEUS_APPS_BACKEND_URL não configurada.");
      error.statusCode = 500;
      throw error;
    }

    if (!appCode) {
      const error = new Error("APP_CODE não configurada no backend.");
      error.statusCode = 500;
      throw error;
    }

    const authorization = String(req.headers.authorization || "");
    if (!authorization.startsWith("Basic ")) {
      const error = new Error("Credenciais de autenticação ausentes.");
      error.statusCode = 401;
      throw error;
    }

    const response = await axios.post(
      `${baseUrl}/auth/autenticar`,
      { codigo: appCode },
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
          "x-app-code": appCode,
        },
      },
    );

    res.set("Cache-Control", "no-store");
    res.status(response.status).json(response.data);
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
