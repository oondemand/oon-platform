const mongoose = require("mongoose");

/**
 * Módulo Multi-moedas (Seção 14) — cadastro/cotação/conversão. As models
 * usam os helpers `fields.currency*`. Aqui ficam a model interna de Moeda
 * e o serviço de conversão padrão.
 */
const moedaSchema = new mongoose.Schema(
  {
    codigo: { type: String, uppercase: true, minlength: 3, maxlength: 3, unique: true },
    nome: String,
    cotacao: { type: Number, default: 1 },
    ativa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Moeda = mongoose.models.Moeda || mongoose.model("Moeda", moedaSchema);

async function converter({ valor, de = "BRL", para = "BRL" }) {
  if (de === para) return valor;
  const [origem, destino] = await Promise.all([
    Moeda.findOne({ codigo: de }),
    Moeda.findOne({ codigo: para }),
  ]);
  const cotacaoDe = origem?.cotacao || 1;
  const cotacaoPara = destino?.cotacao || 1;
  return (valor * cotacaoDe) / cotacaoPara;
}

module.exports = { Moeda, converter };
