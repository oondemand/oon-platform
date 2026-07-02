const GenericError = require("../errors/GenericError");

const LOGIN_PATH = "/integracao/autenticacao-aplicativos/autenticar";
const PERMISSION_PATH = "/integracao/autenticacao-aplicativos/verificar-permissao";

function getBaseUrl(req) {
  const value = process.env.CENTRAL_ATIVACAO_URL || process.env.MEUS_APPS_BACKEND_URL;
  if (!value) {
    throw new GenericError("CENTRAL_ATIVACAO_URL não configurada.", { statusCode: 500 });
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new GenericError("CENTRAL_ATIVACAO_URL inválida.", { statusCode: 500 });
  }

  const currentHost = String(
    req?.headers?.["x-forwarded-host"] || req?.headers?.host || "",
  )
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (
    currentHost &&
    parsed.host.toLowerCase() === currentHost &&
    process.env.AUTH_ALLOW_SAME_HOST !== "true"
  ) {
    throw new GenericError(
      "CENTRAL_ATIVACAO_URL aponta para o próprio Core. Configure o endereço da Central de Ativações.",
      { statusCode: 500 },
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

function getAppCode() {
  const value = String(process.env.APP_CODE || process.env.APP_CODIGO || process.env.APP_KEY || "")
    .trim()
    .toLowerCase();
  if (!value) {
    throw new GenericError("APP_CODE não configurada no backend.", { statusCode: 500 });
  }
  return value;
}

function getTimeout() {
  const value = Number(process.env.AUTH_PROVIDER_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : 10000;
}

module.exports = { LOGIN_PATH, PERMISSION_PATH, getBaseUrl, getAppCode, getTimeout };
