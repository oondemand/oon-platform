const ControleAlteracao = require("../models/ControleAlteracao");

/**
 * Trilha de auditoria de mutações. Em respostas de sucesso (status < 400)
 * grava um registro em ControleAlteracao com o usuário, a entidade e o
 * registro afetado. Usado pelas factories de CRUD e por `defineRoutes`.
 *
 * @param {{ entidade: string, acao: string }} opts
 */
function mutationAudit({ entidade, acao }) {
  return (req, res, next) => {
    const origem = req.headers["x-origem"] || "api";

    const originalJson = res.json.bind(res);
    let responseBody;
    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      const { message, ...rest } = responseBody || {};
      const registro = rest[Object.keys(rest)[0]];

      ControleAlteracao.create({
        entidade,
        acao,
        origem,
        usuario: { nome: req?.usuario?.nome, email: req?.usuario?.email },
        idRegistro: registro?._id,
        dadosAtualizados: registro,
      }).catch((e) => console.log("ERRO AO REGISTRAR AÇÃO", e?.message));
    });

    next();
  };
}

module.exports = { mutationAudit };
