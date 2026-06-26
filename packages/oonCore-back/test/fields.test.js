const test = require("node:test");
const assert = require("node:assert/strict");
const fields = require("../src/core/fields");

test("fields.ref expõe modelo e obrigatoriedade na metadata", () => {
  const descriptor = fields.ref("Pessoa", { required: true, label: "Fornecedor" });

  assert.equal(descriptor.__meta.kind, "ref");
  assert.equal(descriptor.__meta.ref, "Pessoa");
  assert.equal(descriptor.__meta.required, true);
  assert.equal(descriptor.__meta.label, "Fornecedor");
});

test("campos opcionais expõem required false", () => {
  assert.equal(fields.string({ label: "Observações" }).__meta.required, false);
});
