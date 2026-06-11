const { defineTrigger, omie } = require("@oondemand/oon-core-back");

/**
 * Gatilhos de domínio do Serviço.
 *  - before: calcula o valor convertido (valorMoeda * cotação).
 *  - after: dispara o sync com a Omie (no-op se Omie não configurada).
 */
defineTrigger("Servico", {
  before: async (doc) => {
    if (doc.valorMoeda != null && doc.cotacao != null) {
      doc.valorConvertido = Number((doc.valorMoeda * doc.cotacao).toFixed(2));
    }
  },
  after: async (doc) => {
    await omie.sync({
      mapping: "servico-conta-pagar",
      payload: { idServico: String(doc._id), valor: doc.valorConvertido },
    });
  },
});
