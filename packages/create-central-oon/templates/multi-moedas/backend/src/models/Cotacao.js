const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Cotação em moeda estrangeira com valor convertido para BRL. Mostra os
 * helpers `fields.currency*` do módulo Multi-moedas.
 */
defineModel({
  name: "Cotacao",
  singular: "cotacao",
  basePath: "/cotacoes",
  schema: {
    descricao: fields.string({ required: true, label: "Descrição" }),
    valor: fields.currency({ label: "Valor" }),
    moeda: fields.currencyCode({ label: "Moeda" }),
    valorConvertido: fields.currencyConverted({ base: "BRL", label: "Valor (BRL)" }),
    validade: fields.date({ label: "Validade" }),
    status: fields.enum(["rascunho", "enviada", "aprovada", "recusada"], {
      default: "rascunho",
      label: "Status",
    }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
