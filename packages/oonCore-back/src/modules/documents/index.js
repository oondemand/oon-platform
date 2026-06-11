const registry = require("../../core/registry");

/**
 * Módulo Documentos (Seção 16) — resolve um documento declarado via
 * `defineDocument` e renderiza a partir de um template + dados.
 */
function get(name) {
  return registry.listDocuments().find((d) => d.name === name);
}

function render(name, data = {}) {
  const def = get(name);
  if (!def) throw new Error(`Documento "${name}" não registrado.`);
  if (typeof def.render === "function") return def.render(data);
  // Template string simples: {{campo}}.
  return String(def.template || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => data[k] ?? "");
}

module.exports = { get, render };
