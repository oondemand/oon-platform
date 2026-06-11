"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { copyTemplate } = require("./render");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

const TEMPLATES = [
  { id: "basic", description: "Central mínima com uma coleção dinâmica (Pessoa)." },
  { id: "omie-sidecar", description: "Coleção + integração Omie (mapping de cliente)." },
  { id: "servicos-tomados", description: "Serviços tomados com esteira por status." },
  { id: "servicos-prestados", description: "Serviços prestados com esteira por etapa." },
  { id: "pedidos-marketplace", description: "Pedidos de marketplace com esteira." },
  { id: "documentos-fiscais", description: "Documentos fiscais com aprovação." },
  { id: "multi-moedas", description: "Moedas + cotações (módulo currencies)." },
];

function listTemplates() {
  return TEMPLATES;
}

function toSlug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPascal(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function toTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function npmInstall(dir) {
  const r = spawnSync("npm", ["install"], { stdio: "inherit", cwd: dir });
  return !r.status && !r.error;
}

async function run(opts) {
  const template = TEMPLATES.find((t) => t.id === opts.template);
  if (!template) {
    throw new Error(
      `Template "${opts.template}" não existe. Use --list para ver os disponíveis.`
    );
  }

  const slug = toSlug(opts.name);
  if (!slug) throw new Error("Nome de Central inválido.");

  const tokens = { slug, name: toTitle(slug), pascal: toPascal(slug) };

  const targetDir = opts.here ? process.cwd() : path.join(process.cwd(), slug);

  if (!opts.here && fs.existsSync(targetDir)) {
    const empty = fs.readdirSync(targetDir).length === 0;
    if (!empty && !opts.force) {
      throw new Error(`A pasta "${slug}" já existe e não está vazia. Use --force para sobrescrever.`);
    }
  }

  console.log(`\n⚙  Criando Central "${tokens.name}" (template: ${template.id})`);

  // 1. Estrutura comum (backend + frontend mínimos, só domínio/declaração).
  copyTemplate(path.join(TEMPLATES_DIR, "_base"), targetDir, tokens);
  // 2. Overlay do template escolhido (vence sobre o _base).
  copyTemplate(path.join(TEMPLATES_DIR, template.id), targetDir, tokens);

  console.log("✔ Arquivos gerados.");

  if (opts.install) {
    console.log("\n📦 Instalando dependências (best-effort)...");
    const backOk = npmInstall(path.join(targetDir, "backend"));
    const frontOk = npmInstall(path.join(targetDir, "frontend"));
    if (!backOk || !frontOk) {
      console.warn(
        "\n⚠ npm install falhou em um dos projetos (esperado se os pacotes @oondemand/* ainda não foram publicados). Rode manualmente depois."
      );
    }
  }

  printNextSteps(tokens, opts);
}

function printNextSteps(tokens, opts) {
  const cd = opts.here ? "" : `  cd ${tokens.slug}\n`;
  console.log(`
✅ Central "${tokens.name}" pronta.

Próximos passos:
${cd}  # Backend (só domínio — models/validations/triggers/...)
  cd backend && cp .env.example .env && npm run dev

  # Frontend (só declaração — central.ui.json)
  cd ../frontend && cp .env.example .env && npm run dev

O backend expõe /core/metadata; o frontend renderiza as telas a partir dele.
Edite backend/src/models e frontend/central.ui.json para evoluir a Central.
`);
}

module.exports = { run, listTemplates, toSlug, toPascal, toTitle };
