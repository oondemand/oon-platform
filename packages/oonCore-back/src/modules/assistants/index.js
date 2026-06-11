const mongoose = require("mongoose");

/**
 * Módulo Assistentes IA (Seção 13) — catálogo de assistentes, prompts e
 * provedores. O dev só declara `ai: { ... }` na model/pipeline; o
 * mascaramento e os guardrails ficam no Core.
 */
const assistenteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    provedor: { type: String, default: "anthropic" },
    modelo: { type: String, default: "claude-haiku-4-5-20251001" },
    prompt: String,
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Assistente =
  mongoose.models.Assistente || mongoose.model("Assistente", assistenteSchema);

/**
 * Mascara campos sensíveis antes de enviar a um provedor de IA.
 */
function mascarar(texto, segredos = []) {
  let out = String(texto || "");
  for (const s of segredos) {
    if (s) out = out.split(s).join("«redacted»");
  }
  return out;
}

module.exports = { Assistente, mascarar };
