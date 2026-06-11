#!/usr/bin/env node
"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const cmd = process.argv[2];
const cwd = process.cwd();

function loadManifest() {
  return require("../src/deploy/render").loadManifest(cwd);
}

function run(bin, args) {
  const r = spawnSync(bin, args, { stdio: "inherit", cwd });
  if (r.error) {
    console.error(`Falha ao executar ${bin}:`, r.error.message);
    process.exit(1);
  }
  process.exit(r.status || 0);
}

async function main() {
  switch (cmd) {
    case "start": {
      const { start } = require("../src");
      await start({ cwd });
      break;
    }

    case "dev": {
      // Watch + restart usando o próprio Node (>=18.11 tem --watch).
      process.env.NODE_ENV = process.env.NODE_ENV || "development";
      const bootstrap = path.join(__dirname, "dev-runner.js");
      run(process.execPath, ["--watch", bootstrap]);
      break;
    }

    case "activate": {
      const { activate } = require("../src");
      await activate({ cwd });
      process.exit(0);
      break;
    }

    case "build:image": {
      const m = loadManifest();
      require("../src/deploy/render").renderDockerfile({ cwd });
      const tag = `${m.IMAGE}:${m.IMAGE_TAG}`;
      console.log(`Construindo imagem ${tag}...`);
      run("docker", [
        "build",
        "--build-arg",
        `SERVICE_VERSION=${m.IMAGE_TAG}`,
        "-t",
        tag,
        ".",
      ]);
      break;
    }

    case "k8s:render": {
      const files = require("../src/deploy/render").renderK8s({ cwd });
      console.log("Manifests gerados:");
      files.forEach((f) => console.log(" -", path.relative(cwd, f)));
      process.exit(0);
      break;
    }

    case "deploy": {
      const files = require("../src/deploy/render").renderK8s({ cwd });
      console.log("Aplicando manifests no cluster...");
      run("kubectl", ["apply", ...files.flatMap((f) => ["-f", f])]);
      break;
    }

    default:
      console.log(`oonCore-back <comando>

Comandos:
  start         Sobe a Central (produção).
  dev           Sobe com watch/reload.
  activate      Executa seed/ativação (singleton Sistema + hook).
  build:image   Renderiza o Dockerfile e roda 'docker build'.
  k8s:render    Renderiza os manifests k8s a partir de central.manifest.json.
  deploy        Renderiza e aplica os manifests com 'kubectl apply'.
`);
      process.exit(cmd ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
