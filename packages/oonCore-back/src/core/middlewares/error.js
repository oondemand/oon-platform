const helpers = require("../utils/helpers");
const GenericError = require("../errors/GenericError");

/**
 * Error handler central. Trata GenericError (domínio), erros de validação
 * do Mongoose e cai num 500 genérico para o resto.
 */
const errorMiddleware = (error, _req, res, next) => {
  if (!error) return next();

  if (error instanceof GenericError) {
    return helpers.sendErrorResponse({
      res,
      statusCode: error.statusCode,
      error: error.details,
      message: error.message,
    });
  }

  if (error.name === "ValidationError") {
    return helpers.sendErrorResponse({
      res,
      statusCode: 422,
      error: Object.values(error.errors || {}).map((e) => e.message),
      message: "Erro de validação.",
    });
  }

  if (error.name === "CastError") {
    return helpers.sendErrorResponse({
      res,
      statusCode: 400,
      message: "Identificador inválido.",
    });
  }

  console.log("🆘 [UNHANDLED ERROR]:", error?.message || error);
  return helpers.sendErrorResponse({
    res,
    statusCode: 500,
    error: error.message,
    message: "Houve um erro inesperado!",
  });
};

module.exports = errorMiddleware;
