const { defineModel, fields } = require("@oondemand/oon-core-back");

/**
 * Pedido do marketplace. O campo `status` define as colunas da esteira de
 * fulfillment renderizada pelo front (CorePipeline).
 */
defineModel({
  name: "Pedido",
  singular: "pedido",
  basePath: "/pedidos",
  schema: {
    numero: fields.string({ required: true, label: "Número" }),
    cliente: fields.string({ label: "Cliente" }),
    total: fields.currency({ label: "Total" }),
    dataPedido: fields.date({ label: "Data" }),
    status: fields.enum(
      ["novo", "pago", "separacao", "enviado", "entregue", "cancelado"],
      { default: "novo", label: "Status" }
    ),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
