# @oondemand/oon-core-back

📖 **[Documentação completa → ooncoredoc.vercel.app](https://ooncoredoc.vercel.app)**

Core runtime para **Centrais Oon**. O backend de uma Central passa a ser
apenas domínio: você escreve `central.config.js` + `src/models` (e, quando
preciso, `validations / triggers / pipelines / documents / integrations /
routes`) e sobe tudo com `oonCore-back start`.

Toda a infraestrutura — boot, banco, auth, RBAC, logs, auditoria, paginação,
metadata, CRUD, módulos opinativos (Omie, Assistentes, Multi-moedas, Esteiras,
Documentos) e deploy (Docker + k8s) — vive aqui dentro.

## Instalação

```bash
npm install @oondemand/oon-core-back
```

## Uso mínimo

`central.config.js`:

```js
module.exports = {
  serviceName: "minha-central",
  // opcional: provedor de auth (default = Meus Apps)
  // auth: { verifyToken: async (token) => ({ tipo, nome, email }) },
};
```

`src/models/Produto.js`:

```js
const { defineModel, fields } = require("@oondemand/oon-core-back");

defineModel({
  name: "Produto",
  schema: {
    nome: fields.string({ required: true }),
    preco: fields.currency(),
    moeda: fields.currencyCode(),
  },
  crud: { enabled: true, roles: { write: ["admin"] } },
});
```

Subir:

```bash
npx oonCore-back start   # produção
npx oonCore-back dev     # watch/reload
```

Isso já expõe, para `Produto`:

```
GET    /produtos            (list + paginação/filtros/busca/ordenação)
GET    /produtos/:id
POST   /produtos
PUT    /produtos/:id
PATCH  /produtos/:id
DELETE /produtos/:id
POST   /produtos/import
GET    /produtos/export
```

Todas privadas (auth obrigatório), com RBAC e auditoria nas mutações.

## Relacionamentos

Declare campos relacionados com `fields.ref`. A metadata expõe o modelo de
origem e se a seleção é obrigatória, permitindo que o `oon-core-front` monte
automaticamente uma caixa pesquisável:

```js
fornecedor: fields.ref("Pessoa", {
  required: true,
  label: "Fornecedor",
});
```

O frontend consulta o `basePath` de `Pessoa`, permite abrir a lista ou digitar
para filtrar e persiste somente o ObjectId selecionado.

## API pública

```js
const {
  start, createApp, activate,
  defineCentral, defineModel, fields,
  defineCollection, defineDocument, definePipeline,
  defineOmieMapping, defineRoutes, defineValidation, defineTrigger,
  omie, GenericError, registry,
} = require("@oondemand/oon-core-back");
```

### `defineRoutes` — rotas customizadas com o contrato de segurança

Nunca se usa `express.Router()` cru. `router.private.*` aplica auth + RBAC
(+ auditoria opcional); `router.public.*` é aberto.

```js
const { defineRoutes } = require("@oondemand/oon-core-back");

defineRoutes("/relatorios", (router) => {
  router.private.get("/resumo", { roles: ["admin"] }, async (req, res) => {
    res.json({ ok: true, usuario: req.usuario });
  });
  router.public.get("/health", async (_req, res) => res.json({ up: true }));
});
```

## Rotas `/core/*` (contrato com o oonCore-front)

```
GET /core/metadata     GET /core/models      GET /core/models/:name
GET /core/collections  GET /core/documents   GET /core/pipelines
GET /core/integrations GET /core/permissions GET /core/actions
GET /core/menus        GET /core/features
```

## CLI

```bash
oonCore-back start        # produção
oonCore-back dev          # watch/reload
oonCore-back activate     # seed/ativação (singleton Sistema + hook)
oonCore-back build:image  # renderiza Dockerfile + docker build
oonCore-back k8s:render   # renderiza manifests a partir de central.manifest.json
oonCore-back deploy       # kubectl apply dos manifests
```

O consumidor não escreve YAML: ajusta `central.manifest.json` e o Core
renderiza Dockerfile + ConfigMap/Secret/Deployment/Service/Ingress/HPA/Certificate.

## Testes

```bash
npm test                 # invariantes de segurança (offline)
MONGO_URI=... npm test   # inclui CRUD + auditoria (requer Mongo)
```

## Variáveis de ambiente principais

`SERVICE_NAME`, `SERVICE_VERSION`, `PORT`, `NODE_ENV`,
`DB_SERVER`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_AUTH_SOURCE`/`DB_REPLICA_SET`/`DB_TSL`
(ou `MONGO_URI`), `MEUS_APPS_BACKEND_URL`, `OMIE_APP_KEY`/`OMIE_APP_SECRET`.
