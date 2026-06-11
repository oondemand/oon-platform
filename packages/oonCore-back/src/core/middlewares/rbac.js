const Helpers = require("../utils/helpers");

/**
 * RBAC simples baseado em `req.usuario.tipo`. `roles` vazio => qualquer
 * usuário autenticado. `admin` sempre passa.
 *
 * @param {string[]} roles papéis permitidos
 */
function rbac(roles = []) {
  return (req, res, next) => {
    if (!roles.length) return next();
    const tipo = req.usuario?.tipo;
    if (tipo === "admin" || roles.includes(tipo)) return next();
    return Helpers.sendErrorResponse({
      res,
      statusCode: 403,
      message: "Acesso negado para o seu perfil.",
    });
  };
}

module.exports = { rbac };
