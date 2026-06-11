"use strict";

/**
 * Teste de integração que exige um MongoDB. Cobre os critérios 2.9 que
 * tocam o banco: CRUD completo de uma model com crud.enabled e geração
 * de registro em ControleAlteracao numa mutação.
 *
 * Roda apenas se MONGO_URI estiver definido (ex.: mongodb-memory-server
 * ou um Mongo local). Caso contrário, é pulado para manter o CI offline.
 */
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const mongoose = require("mongoose");

const SKIP = !process.env.MONGO_URI;

describe("CRUD + auditoria (requer Mongo)", { skip: SKIP && "defina MONGO_URI" }, () => {
  const core = require("../src");
  const { createApp } = require("../src/boot/createApp");
  const ControleAlteracao = require("../src/core/models/ControleAlteracao");

  // Auth de teste: qualquer token "admin" autentica como admin.
  core.defineCentral({
    auth: { verifyToken: async () => ({ tipo: "admin", nome: "Tester", email: "t@t.co" }) },
  });

  core.defineModel({
    name: "Produto",
    schema: { nome: core.fields.string({ required: true }), preco: core.fields.currency() },
    crud: { enabled: true },
  });

  let server;
  let baseUrl;
  const auth = { authorization: "Bearer admin" };

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const app = createApp();
    await new Promise((r) => (server = app.listen(0, r)));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) server.close();
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  });

  const req = (method, path, body) =>
    new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const r = http.request(
        `${baseUrl}${path}`,
        { method, headers: { "content-type": "application/json", ...auth } },
        (res) => {
          let raw = "";
          res.on("data", (c) => (raw += c));
          res.on("end", () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }));
        }
      );
      r.on("error", reject);
      if (data) r.write(data);
      r.end();
    });

  test("ciclo CRUD completo", async () => {
    const created = await req("POST", "/produtos", { nome: "Café", preco: 10 });
    assert.equal(created.status, 201);
    const id = created.body.produto._id;

    const list = await req("GET", "/produtos");
    assert.equal(list.status, 200);
    assert.ok(list.body.results.length >= 1);
    assert.ok(list.body.pagination.totalItems >= 1);

    const got = await req("GET", `/produtos/${id}`);
    assert.equal(got.body.produto.nome, "Café");

    const updated = await req("PUT", `/produtos/${id}`, { nome: "Café Premium", preco: 15 });
    assert.equal(updated.body.produto.nome, "Café Premium");

    const removed = await req("DELETE", `/produtos/${id}`);
    assert.equal(removed.status, 200);
  });

  test("mutação gera registro em ControleAlteracao", async () => {
    const before = await ControleAlteracao.countDocuments();
    await req("POST", "/produtos", { nome: "Açúcar", preco: 5 });
    // o registro é gravado no 'finish', aguarda um tick.
    await new Promise((r) => setTimeout(r, 200));
    const after = await ControleAlteracao.countDocuments();
    assert.ok(after > before, "ControleAlteracao deve ter um novo registro");
  });
});
