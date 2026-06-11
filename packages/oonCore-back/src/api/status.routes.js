const express = require("express");
const mongoose = require("mongoose");
const ctx = require("../core/context");

const router = express.Router();

router.get("/", (_req, res) => {
  const states = {
    0: "Desconectado",
    1: "Conectado",
    2: "Conectando",
    3: "Desconectando",
  };
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    message: `${ctx.config.serviceName} rodando - vs ${ctx.config.serviceVersion}`,
    database: states[dbState] || "Status desconhecido",
  });
});

module.exports = router;
