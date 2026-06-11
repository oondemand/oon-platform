const { defineModel, fields } = require("@oondemand/oon-core-back");

/** Prestador de serviço. */
defineModel({
  name: "Pessoa",
  singular: "pessoa",
  basePath: "/pessoas",
  schema: {
    nome: fields.string({ required: true, label: "Nome" }),
    email: fields.string({ label: "E-mail" }),
    documento: fields.string({ label: "Documento" }),
    status: fields.enum(["ativo", "inativo"], { label: "Status", default: "ativo" }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
