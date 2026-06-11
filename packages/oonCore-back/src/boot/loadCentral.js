const fs = require("node:fs");
const path = require("node:path");
const ctx = require("../core/context");

/**
 * Descobre e carrega a Central do consumidor:
 *   1. `central.config.js` na raiz do projeto (mescla na config do Core);
 *   2. arquivos de domínio em `src/{models,validations,triggers,routes,
 *      pipelines,documents,integrations,mappings}` (apenas `require`,
 *      o efeito colateral é registrar via `define*`).
 */
const DOMAIN_DIRS = [
  "models",
  "validations",
  "triggers",
  "routes",
  "pipelines",
  "documents",
  "integrations",
  "mappings",
  "hooks",
];

function loadCentral(cwd = process.cwd()) {
  const configPath = path.join(cwd, "central.config.js");
  if (fs.existsSync(configPath)) {
    const config = require(configPath);
    ctx.setConfig(typeof config === "function" ? config() : config);
  }

  const srcDir = path.join(cwd, "src");
  for (const dir of DOMAIN_DIRS) {
    const full = path.join(srcDir, dir);
    if (fs.existsSync(full)) requireDir(full);
  }

  return ctx.config;
}

function requireDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      requireDir(full);
    } else if (/\.(js|cjs)$/.test(entry.name)) {
      require(full);
    }
  }
}

module.exports = { loadCentral, DOMAIN_DIRS };
