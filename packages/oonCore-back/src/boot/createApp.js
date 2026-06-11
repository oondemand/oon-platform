const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const ctx = require("../core/context");
const registry = require("../core/registry");
const correlationId = require("../core/middlewares/correlationId");
const requestLog = require("../core/middlewares/requestLog");
const errorMiddleware = require("../core/middlewares/error");
const { buildModelRouter } = require("../core/factories/modelRouter");

const coreRoutes = require("../api/core.routes");
const statusRoutes = require("../api/status.routes");
const authRoutes = require("../api/auth.routes");

/**
 * Cria a app Express do Core: middlewares transversais, rotas públicas,
 * /core/*, routers de CRUD gerados pelo registry e rotas customizadas
 * (defineRoutes). Tudo derivado do que foi registrado — sem domínio fixo.
 */
function createApp() {
  const app = express();

  app.use(cors(ctx.config.cors));
  app.use(helmet());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(correlationId);
  if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

  // Públicas.
  app.use("/", statusRoutes);
  app.use("/auth", authRoutes);
  app.use("/core", coreRoutes);

  // Log de mutações (após status/core que são GET, antes do domínio).
  app.use(requestLog);

  // CRUD gerado por model registrada.
  for (const entry of registry.listModels()) {
    if (entry.definition.crud?.enabled === false) continue;
    const basePath = entry.definition.basePath || `/${entry.singular}s`;
    app.use(basePath, buildModelRouter(entry));
  }

  // Rotas customizadas (defineRoutes).
  for (const { basePath, expressRouter } of registry.listRoutes()) {
    app.use(basePath, expressRouter);
  }

  app.use(errorMiddleware);
  return app;
}

module.exports = { createApp };
