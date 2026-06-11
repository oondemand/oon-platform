const axios = require("axios");
const registry = require("../../core/registry");

/**
 * Módulo Omie (Seção 12) — engine + fila + retry. O dev declara
 * `defineOmieMapping(...)` ou usa `omie.sync(...)` em triggers; toda a
 * mecânica de chamada/retentativa fica aqui.
 */
const queue = [];
let draining = false;

async function callOmie({ endpoint, call, param }, { retries = 3 } = {}) {
  const base = process.env.API_OMIE || "https://app.omie.com.br/api/v1";
  const body = {
    call,
    app_key: process.env.OMIE_APP_KEY,
    app_secret: process.env.OMIE_APP_SECRET,
    param: Array.isArray(param) ? param : [param],
  };

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.post(`${base}/${endpoint}/`, body);
      return data;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
  throw lastErr;
}

function enqueue(job) {
  queue.push(job);
  drain();
}

async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    const job = queue.shift();
    try {
      await job();
    } catch (err) {
      console.log("[omie] job falhou:", err?.message);
    }
  }
  draining = false;
}

/**
 * Helper usado em triggers: resolve o mapping registrado e enfileira o
 * sync. Se não houver app_key configurada, vira no-op seguro.
 */
const omie = {
  async sync({ mapping, payload, ...rest }) {
    if (!process.env.OMIE_APP_KEY) return { skipped: true };
    const def = mapping ? registry.listOmieMappings().find((m) => m.name === mapping) : null;
    const request = def?.toOmie ? def.toOmie(payload) : { ...rest, param: payload };
    return new Promise((resolve, reject) => {
      enqueue(() => callOmie(request).then(resolve).catch(reject));
    });
  },
  call: callOmie,
};

module.exports = { omie };
