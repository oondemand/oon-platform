"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const core = require("../src");
const { createApp } = require("../src/boot/createApp");

// Model de teste com CRUD habilitado (sem domínio do CST).
core.defineModel({
  name: "TestItem",
  singular: "testItem",
  schema: {
    nome: core.fields.string({ required: true }),
    preco: core.fields.currency(),
    moeda: core.fields.currencyCode(),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server && server.close());

function request(method, path, { body, headers } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          "content-type": "application/json",
          ...(headers || {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null })
        );
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

test("GET /core/metadata retorna a model registrada", async () => {
  const res = await request("GET", "/core/metadata");
  assert.equal(res.status, 200);
  const names = res.body.models.map((m) => m.name);
  assert.ok(names.includes("TestItem"), "TestItem deve aparecer na metadata");

  const item = res.body.models.find((m) => m.name === "TestItem");
  assert.equal(item.crud, true);
  const fieldNames = item.fields.map((f) => f.name);
  assert.deepEqual(fieldNames.sort(), ["moeda", "nome", "preco"]);
});

test("GET /core/models/:name expõe os campos e tipos", async () => {
  const res = await request("GET", "/core/models/TestItem");
  assert.equal(res.status, 200);
  const preco = res.body.fields.find((f) => f.name === "preco");
  assert.equal(preco.kind, "currency");
});

test("rota privada sem token retorna 401 (GET)", async () => {
  const res = await request("GET", "/testItems");
  assert.equal(res.status, 401);
});

test("rota privada sem token retorna 401 (POST mutação)", async () => {
  const res = await request("POST", "/testItems", { body: { nome: "x" } });
  assert.equal(res.status, 401);
});

test("os 6 endpoints + import/export estão montados no router", async () => {
  // Sem token todos devolvem 401, provando que a rota existe (não 404).
  const rotas = [
    ["GET", "/testItems"],
    ["GET", "/testItems/123"],
    ["POST", "/testItems"],
    ["PUT", "/testItems/123"],
    ["PATCH", "/testItems/123"],
    ["DELETE", "/testItems/123"],
    ["POST", "/testItems/import"],
    ["GET", "/testItems/export"],
  ];
  for (const [method, path] of rotas) {
    const res = await request(method, path);
    assert.equal(res.status, 401, `${method} ${path} deveria existir (401, não 404)`);
  }
});
