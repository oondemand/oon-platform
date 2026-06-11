const express = require("express");
const auth = require("../core/middlewares/auth");
const { asyncHandler, sendResponse } = require("../core/utils/helpers");

/**
 * Rotas de autenticação do Core. O login propriamente dito é delegado ao
 * provedor configurado (Meus Apps por padrão); aqui validamos o token e
 * devolvemos o usuário resolvido.
 */
const router = express.Router();

router.get(
  "/validar-token",
  auth,
  asyncHandler(async (req, res) => {
    sendResponse({ res, statusCode: 200, usuario: req.usuario });
  })
);

module.exports = router;
