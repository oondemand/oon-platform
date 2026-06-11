const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Serviço tomado, vinculado a uma Pessoa. O campo `statusProcessamento` define
 * as colunas da esteira renderizada pelo front (CorePipeline).
 */
defineModel({
  name: "Servico",
  singular: "servico",
  basePath: "/servicos",
  schema: {
    descricao: fields.string({ required: true, label: "Descrição" }),
    pessoa: fields.ref("Pessoa", { required: true, label: "Prestador" }),
    valor: fields.currency({ label: "Valor" }),
    dataContratacao: fields.date({ label: "Contratação" }),
    statusProcessamento: fields.enum(
      ["aberto", "pendente", "processando", "pago", "cancelado"],
      { default: "aberto", label: "Etapa" }
    ),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
