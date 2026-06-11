const { defineModel, fields } = require("@oondemand/oon-core-back");

/** Produto do catálogo do marketplace. */
defineModel({
  name: "Produto",
  singular: "produto",
  basePath: "/produtos",
  schema: {
    nome: fields.string({ required: true, label: "Produto" }),
    sku: fields.string({ label: "SKU" }),
    preco: fields.currency({ label: "Preço" }),
    estoque: fields.number({ label: "Estoque", default: 0 }),
    status: fields.enum(["ativo", "inativo"], { label: "Status", default: "ativo" }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
