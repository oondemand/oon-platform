#!/usr/bin/env node

/**
 * CLI do @oondemand/oon-core-front (Fase 3 — Seção 4.5).
 *
 *   oonCore-front dev            Sobe o Vite em modo dev.
 *   oonCore-front build          Build de produção (vite build).
 *   oonCore-front preview        Serve o build (vite preview).
 *   oonCore-front sync:metadata  Baixa /core/metadata do back e cacheia em
 *                                src/.oon/metadata.json para tipos/dev offline.
 *
 * O Core não impõe Vite ao consumidor: ele apenas encaminha para o binário
 * local do projeto. `sync:metadata` lê a URL do back de OON_API_URL /
 * VITE_API_URL no .env do projeto.
 */

import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const cmd = process.argv[2];
const cwd = process.cwd();

function runVite(args) {
  const bin = path.join(cwd, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
  const exec = fs.existsSync(bin) ? bin : "vite";
  const r = spawnSync(exec, args, { stdio: "inherit", cwd });
  if (r.error) {
    console.error("Falha ao executar vite:", r.error.message);
    console.error("Instale o vite no projeto da Central: npm i -D vite");
    process.exit(1);
  }
  process.exit(r.status || 0);
}

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(cwd, ".env");
  if (!fs.existsSync(envPath)) return undefined;
  const line = fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${name}=`));
  return line ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") : undefined;
}

async function syncMetadata() {
  const apiUrl = readEnv("OON_API_URL") || readEnv("VITE_API_URL");
  if (!apiUrl) {
    console.error("Defina OON_API_URL ou VITE_API_URL (.env) apontando para o back da Central.");
    process.exit(1);
  }
  const url = `${apiUrl.replace(/\/$/, "")}/core/metadata`;
  console.log(`Baixando metadata de ${url} ...`);
  const res = await fetch(url).catch((err) => {
    console.error("Falha de rede:", err.message);
    process.exit(1);
  });
  if (!res.ok) {
    console.error(`Back respondeu ${res.status}.`);
    process.exit(1);
  }
  const metadata = await res.json();
  const outDir = path.join(cwd, "src", ".oon");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "metadata.json");
  fs.writeFileSync(outFile, JSON.stringify(metadata, null, 2));
  const models = (metadata.models || []).length;
  console.log(`Metadata cacheada em ${path.relative(cwd, outFile)} (${models} models).`);
  process.exit(0);
}

async function main() {
  switch (cmd) {
    case "dev":
      return runVite(["dev"]);
    case "build":
      return runVite(["build"]);
    case "preview":
      return runVite(["preview"]);
    case "sync:metadata":
      return syncMetadata();
    default:
      console.log(`oonCore-front <comando>

Comandos:
  dev             Sobe a Central em modo dev (vite dev).
  build           Build de produção (vite build).
  preview         Serve o build (vite preview).
  sync:metadata   Baixa /core/metadata do back e cacheia em src/.oon/metadata.json.
`);
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
