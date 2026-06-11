const { defineModel, fields } = require("@oondemand/oon-core-back");

/** Cliente a quem os serviços são prestados. */
defineModel({
  name: "Cliente",
  singular: "cliente",
  basePath: "/clientes",
  schema: {
    nome: fields.string({ required: true, label: "Nome" }),
    email: fields.string({ label: "E-mail" }),
    documento: fields.string({ label: "Documento" }),
    status: fields.enum(["ativo", "inativo"], { label: "Status", default: "ativo" }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
