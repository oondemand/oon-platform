const Log = require("../models/Log");

/**
 * Registra requisições mutantes (não-GET) na model interna Log.
 * Captura status e corpo da resposta no `finish`.
 */
const requestLog = async (req, res, next) => {
  if (req.method === "GET") return next();

  const log = new Log({
    usuario: req.usuario || null,
    endpoint: req.originalUrl,
    metodo: req.method,
    ip: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress,
    correlationId: req.correlationId,
    dadosRequisicao: req.body,
  });

  res.on("finish", () => {
    log.statusResposta = res.statusCode;
    log.dadosResposta = res.locals.body || null;
    log.save().catch(() => {});
  });

  next();
};

module.exports = requestLog;
