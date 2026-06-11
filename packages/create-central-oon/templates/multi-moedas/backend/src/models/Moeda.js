const { defineModel, fields } = require("@oondemand/oon-core-back");

/** Moeda com cotação corrente (atualizada via action do módulo currencies). */
defineModel({
  name: "Moeda",
  singular: "moeda",
  basePath: "/moedas",
  schema: {
    codigo: fields.currencyCode({ required: true, label: "Código" }),
    nome: fields.string({ required: true, label: "Nome" }),
    cotacao: fields.number({ label: "Cotação (BRL)", default: 1 }),
    ativa: fields.boolean({ label: "Ativa", default: true }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
