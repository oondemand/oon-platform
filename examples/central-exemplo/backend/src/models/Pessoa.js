const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Pessoa de negócio (PF/PJ/externa). Domínio puro: só o schema e o CRUD.
 * Auth, RBAC, paginação, auditoria e metadata vêm do Core.
 */
defineModel({
  name: "Pessoa",
  singular: "pessoa",
  basePath: "/pessoas",
  schema: {
    grupo: fields.string({ label: "Grupo" }),
    email: fields.string({ label: "E-mail" }),
    tipo: fields.enum(["pf", "pj", "ext"], { label: "Tipo", default: "pf" }),
    nome: fields.string({ required: true, label: "Nome" }),
    documento: fields.string({ label: "Documento" }),
    status: fields.enum(["ativo", "inativo", "arquivado"], { default: "ativo" }),
    cadastro_aprovado: fields.boolean({ default: false }),
    codigo_cliente_omie: fields.string({ searchable: false }),
    status_sincronizacao_omie: fields.enum(["sucesso", "pendente", "erro"], {
      default: "pendente",
    }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
