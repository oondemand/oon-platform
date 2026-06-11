const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Pessoa/Cliente sincronizada com a Omie. Os campos de sincronização são
 * preenchidos pelo Core via o mapping declarado em src/mappings.
 */
defineModel({
  name: "Pessoa",
  singular: "pessoa",
  basePath: "/pessoas",
  schema: {
    nome: fields.string({ required: true, label: "Nome" }),
    email: fields.string({ label: "E-mail" }),
    documento: fields.string({ label: "Documento" }),
    tipo: fields.enum(["pf", "pj"], { label: "Tipo", default: "pf" }),
    codigo_cliente_omie: fields.string({ searchable: false, label: "Código Omie" }),
    status_sincronizacao_omie: fields.enum(["pendente", "sucesso", "erro"], {
      default: "pendente",
      label: "Sync Omie",
    }),
    status: fields.enum(["ativo", "inativo"], { label: "Status", default: "ativo" }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
