const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Serviço prestado a um Cliente. O campo `etapa` define as colunas da esteira
 * renderizada pelo front (CorePipeline).
 */
defineModel({
  name: "ServicoPrestado",
  singular: "servicoPrestado",
  basePath: "/servicos-prestados",
  schema: {
    descricao: fields.string({ required: true, label: "Descrição" }),
    cliente: fields.ref("Cliente", { required: true, label: "Cliente" }),
    valor: fields.currency({ label: "Valor" }),
    dataInicio: fields.date({ label: "Início" }),
    etapa: fields.enum(["proposta", "em-execucao", "entregue", "faturado", "cancelado"], {
      default: "proposta",
      label: "Etapa",
    }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
