const mongoose = require("mongoose");

/**
 * Log de requisições mutantes. Model interna do Core — registrada
 * automaticamente pelo requestLog middleware. Não é domínio do cliente.
 */
const logSchema = new mongoose.Schema(
  {
    usuario: { type: Object, required: false },
    endpoint: { type: String, required: true },
    metodo: { type: String, required: true },
    ip: { type: String },
    correlationId: { type: String },
    dadosRequisicao: { type: Object },
    dadosResposta: { type: Object },
    statusResposta: { type: Number },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Log || mongoose.model("Log", logSchema);
