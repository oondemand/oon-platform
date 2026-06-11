const fs = require("node:fs");
const path = require("node:path");

const TEMPLATES_DIR = path.join(__dirname, "templates");

/**
 * Defaults dos manifests. São sobrescritos pelo `central.manifest.json`
 * do consumidor. O dev não escreve YAML — só ajusta esses valores.
 */
const DEFAULTS = {
  SERVICE_NAME: "central-oon",
  NAMESPACE: "default",
  IMAGE: "ghcr.io/oondemand/central-oon",
  IMAGE_TAG: "latest",
  PORT: "4000",
  REPLICAS: "1",
  NODE_ENV: "production",
  MEM_REQUEST: "128Mi",
  MEM_LIMIT: "256Mi",
  CPU_REQUEST: "0.1",
  CPU_LIMIT: "0.2",
  HPA_MIN: "1",
  HPA_MAX: "3",
  HPA_CPU_TARGET: "70",
  HOST: "central.example.com",
  DB_SERVER: "",
  DB_NAME: "",
  DB_AUTH_SOURCE: "",
  DB_REPLICA_SET: "",
  DB_TSL: "",
  DB_USER: "",
  DB_PASSWORD: "",
  JWT_SECRET: "",
  OMIE_APP_KEY: "",
  OMIE_APP_SECRET: "",
  MEUS_APPS_BACKEND_URL: "",
};

const K8S_TEMPLATES = [
  "configmap.yaml",
  "secret.yaml",
  "deployment.yaml",
  "service.yaml",
  "ingress.yaml",
  "hpa.yaml",
  "certificate.yaml",
];

function interpolate(content, vars) {
  return content.replace(/\$\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : ""
  );
}

function loadManifest(cwd = process.cwd()) {
  const file = path.join(cwd, "central.manifest.json");
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return { ...DEFAULTS, ...user };
}

/**
 * Renderiza os manifests k8s para `outDir` (default: ./k8s) a partir do
 * central.manifest.json. Retorna a lista de arquivos gerados.
 */
function renderK8s({ cwd = process.cwd(), outDir } = {}) {
  const vars = loadManifest(cwd);
  const target = outDir || path.join(cwd, "k8s");
  fs.mkdirSync(target, { recursive: true });

  const written = [];
  for (const tpl of K8S_TEMPLATES) {
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, tpl), "utf8");
    const out = interpolate(raw, vars);
    const dest = path.join(target, tpl);
    fs.writeFileSync(dest, out);
    written.push(dest);
  }
  return written;
}

function renderDockerfile({ cwd = process.cwd() } = {}) {
  const raw = fs.readFileSync(path.join(TEMPLATES_DIR, "Dockerfile"), "utf8");
  const dest = path.join(cwd, "Dockerfile");
  fs.writeFileSync(dest, raw);
  return dest;
}

module.exports = { renderK8s, renderDockerfile, loadManifest, DEFAULTS, TEMPLATES_DIR };
