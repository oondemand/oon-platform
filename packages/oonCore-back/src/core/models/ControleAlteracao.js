const mongoose = require("mongoose");

/**
 * Trilha de auditoria de mutações. Diferente da versão do CST, no Core
 * `entidade` é uma string livre (o registry conhece o nome da model em
 * runtime) e `acao`/`origem` aceitam os valores padrão sem enum rígido,
 * porque o Core não pode enumerar o domínio do cliente.
 */
const ACOES_PADRAO = ["adicionado", "alterado", "excluido"];
const ORIGENS_PADRAO = ["form", "datagrid", "importacao", "api"];

const controleAlteracaoSchema = new mongoose.Schema({
  dataHora: { type: Date, default: Date.now, required: true },
  usuario: { nome: String, email: String },
  entidade: { type: String, required: true },
  acao: { type: String, required: true },
  origem: { type: String, default: "api" },
  idRegistro: { type: String },
  dadosAtualizados: { type: Object },
});

const ControleAlteracao =
  mongoose.models.ControleAlteracao ||
  mongoose.model("ControleAlteracao", controleAlteracaoSchema);

module.exports = ControleAlteracao;
module.exports.ACOES_PADRAO = ACOES_PADRAO;
module.exports.ORIGENS_PADRAO = ORIGENS_PADRAO;
