#!/usr/bin/env node
"use strict";

/**
 * CLI do create-central-oon (Fase 4 — Seção 5/25).
 *
 *   npx create-central-oon <nome-da-central> [opções]
 *
 * Opções:
 *   --template=<t>   Template inicial (default: basic). Veja --list.
 *   --here           Gera na pasta atual em vez de criar <nome>/.
 *   --force          Sobrescreve pasta existente.
 *   --no-install     Não roda npm install nos projetos gerados.
 *   --list           Lista os templates disponíveis e sai.
 */

const { run, listTemplates } = require("../src/index");

function parseArgs(argv) {
  const opts = { template: "basic", here: false, force: false, install: true, list: false };
  const positionals = [];
  for (const arg of argv) {
    if (arg === "--here") opts.here = true;
    else if (arg === "--force") opts.force = true;
    else if (arg === "--no-install") opts.install = false;
    else if (arg === "--list") opts.list = true;
    else if (arg.startsWith("--template=")) opts.template = arg.slice("--template=".length);
    else if (arg === "--template") opts.template = argv[argv.indexOf(arg) + 1];
    else if (!arg.startsWith("-")) positionals.push(arg);
  }
  opts.name = positionals[0];
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.list) {
    console.log("Templates disponíveis:\n");
    for (const t of listTemplates()) console.log(`  ${t.id.padEnd(20)} ${t.description}`);
    process.exit(0);
  }

  if (!opts.name) {
    console.error("Uso: npx create-central-oon <nome-da-central> [--template=basic]");
    console.error("     npx create-central-oon --list");
    process.exit(1);
  }

  try {
    await run(opts);
  } catch (err) {
    console.error("\n✖", err.message);
    process.exit(1);
  }
}

main();
