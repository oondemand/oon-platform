const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Serviço tomado, vinculado a uma Pessoa, com valor em moeda estrangeira
 * e conversão. Mostra os helpers `fields.currency*` do módulo Multi-moedas.
 */
defineModel({
  name: "Servico",
  singular: "servico",
  basePath: "/servicos",
  schema: {
    tipoServicoTomado: fields.string({ label: "Tipo de serviço" }),
    descricao: fields.string({ label: "Descrição" }),
    pessoa: fields.ref("Pessoa", { required: true, label: "Prestador" }),
    valorMoeda: fields.currency({ label: "Valor (moeda origem)" }),
    moeda: fields.currencyCode({ label: "Moeda" }),
    cotacao: fields.number({ label: "Cotação aplicada" }),
    valorConvertido: fields.currencyConverted({ base: "BRL", label: "Valor (BRL)" }),
    dataContratacao: fields.date(),
    dataConclusao: fields.date(),
    status: fields.enum(["ativo", "inativo", "arquivado"], { default: "ativo" }),
    statusProcessamento: fields.enum(
      ["aberto", "pendente", "processando", "pago", "pago-externo"],
      { default: "aberto" }
    ),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
