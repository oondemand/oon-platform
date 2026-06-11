const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Documento fiscal com fluxo de aprovação. O front (CoreDocument) usa o
 * `status` para badge e as actions RESTful approve/reject do Core.
 */
defineModel({
  name: "DocumentoFiscal",
  singular: "documentoFiscal",
  basePath: "/documentos-fiscais",
  schema: {
    numero: fields.string({ required: true, label: "Número" }),
    tipo: fields.enum(["nfe", "nfse", "nfce", "outro"], { label: "Tipo", default: "nfe" }),
    emitente: fields.string({ label: "Emitente" }),
    valor: fields.currency({ label: "Valor" }),
    dataEmissao: fields.date({ label: "Emissão" }),
    status: fields.enum(["pendente", "aprovado", "reprovado"], {
      default: "pendente",
      label: "Status",
    }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
