const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");
const {
  defaultVerifyToken,
} = require("../src/core/middlewares/auth");

test("defaultVerifyToken envia APP_CODE e preserva o perfil retornado", async () => {
  const originalGet = axios.get;
  const originalUrl = process.env.CENTRAL_ATIVACAO_URL;
  const originalCode = process.env.APP_CODE;

  process.env.CENTRAL_ATIVACAO_URL = "https://ativacao.example.com/";
  process.env.APP_CODE = "Central-Teste";

  axios.get = async (url, config) => {
    assert.equal(
      url,
      "https://ativacao.example.com/auth/verificar-permissao-aplicativo",
    );
    assert.equal(config.headers.Authorization, "Bearer token-valido");
    assert.equal(config.headers["x-app-code"], "central-teste");

    return {
      data: {
        usuario: {
          id: "usuario-1",
          tipo: "master",
          perfil: "administrador",
          nome: "Usuário Teste",
          email: "teste@example.com",
          permissoes: { podePublicar: true },
        },
      },
    };
  };

  try {
    const usuario = await defaultVerifyToken("token-valido");
    assert.equal(usuario.tipo, "admin");
    assert.equal(usuario.perfil, "administrador");
    assert.deepEqual(usuario.permissoes, { podePublicar: true });
  } finally {
    axios.get = originalGet;
    process.env.CENTRAL_ATIVACAO_URL = originalUrl;
    process.env.APP_CODE = originalCode;
  }
});

test("defaultVerifyToken propaga 403 quando o usuário não possui o app", async () => {
  const originalGet = axios.get;
  const originalUrl = process.env.CENTRAL_ATIVACAO_URL;
  const originalCode = process.env.APP_CODE;

  process.env.CENTRAL_ATIVACAO_URL = "https://ativacao.example.com";
  process.env.APP_CODE = "central-teste";

  axios.get = async () => {
    const error = new Error("Request failed with status code 403");
    error.response = {
      status: 403,
      data: { message: "Usuário sem permissão ativa para o aplicativo." },
    };
    throw error;
  };

  try {
    await assert.rejects(
      () => defaultVerifyToken("token-sem-acesso"),
      (error) => {
        assert.equal(error.statusCode, 403);
        assert.equal(
          error.message,
          "Usuário sem permissão ativa para o aplicativo.",
        );
        return true;
      },
    );
  } finally {
    axios.get = originalGet;
    process.env.CENTRAL_ATIVACAO_URL = originalUrl;
    process.env.APP_CODE = originalCode;
  }
});
