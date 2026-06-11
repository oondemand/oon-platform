const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Cotacao — model de aceitação da plataforma (Seção 6): declarada só com
 * `defineModel`, sem nenhum código de UI nem de infra. Serve para o
 * `central.ui.json` do front renderizar a tela em `mode: "dynamic"`.
 */
defineModel({
  name: "Cotacao",
  singular: "cotacao",
  basePath: "/cotacoes",
  schema: {
    cliente: fields.ref("Pessoa", { required: true, label: "Cliente" }),
    descricao: fields.string({ label: "Descrição" }),
    valor: fields.currency({ label: "Valor" }),
    moeda: fields.currencyCode({ label: "Moeda" }),
    valorConvertido: fields.currencyConverted({ base: "BRL", label: "Valor (BRL)" }),
    validade: fields.date({ label: "Validade" }),
    status: fields.enum(["rascunho", "enviada", "aprovada", "recusada"], {
      default: "rascunho",
    }),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
