const crypto = require("node:crypto");

/**
 * Garante um correlationId por requisição (header `x-correlation-id` ou
 * gerado). Exposto em `req.correlationId` e ecoado na resposta.
 */
module.exports = function correlationId(req, res, next) {
  const id = req.headers["x-correlation-id"] || crypto.randomUUID();
  req.correlationId = id;
  res.setHeader("x-correlation-id", id);
  next();
};
