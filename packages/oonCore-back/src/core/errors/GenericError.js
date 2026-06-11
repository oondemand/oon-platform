/**
 * Erro de domínio reconhecido pelo error middleware do Core.
 * Permite que services/triggers sinalizem statusCode e detalhes.
 */
class GenericError extends Error {
  constructor(message, { statusCode = 400, details = null } = {}) {
    super(message);
    this.name = "GenericError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = GenericError;
