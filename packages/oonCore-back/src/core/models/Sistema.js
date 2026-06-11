const mongoose = require("mongoose");

/**
 * Configuração singleton da Central (chaves de integração, remetente, etc.).
 * Model interna do Core. O cliente estende via `central.config.js`.
 */
const omieSchema = new mongoose.Schema(
  {
    id_conta_corrente: { type: Number },
    codigo_categoria: { type: String },
  },
  { _id: false }
);

const sistemaSchema = new mongoose.Schema(
  {
    omie: omieSchema,
    openIaKey: String,
    appKey: String,
    sendgrid_api_key: { type: String },
    remetente: { type: { nome: String, email: String } },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Sistema || mongoose.model("Sistema", sistemaSchema);
