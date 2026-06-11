# Implementação oonCore Platform v4 — Passo a passo dentro de `projeto-scaffold`

> Documento de execução para transformar as aplicações que vivem em `projeto-scaffold/`
> nos pacotes da plataforma: **`@oondemand/oon-core-back`**, **`@oondemand/oon-core-front`** e
> o scaffold **`create-central-oon`**.
>
> Requisito de origem: `project-scopes/oonCore-platform-v4-core-back-front-scaffold.md`.

---

## 0. Leitura do estado atual (o que já temos nesta pasta)

```txt
projeto-scaffold/
├── projeto-scaffold-backend/    # cópia completa do cst-multimoedas-backend (monólito Express+Mongoose)
│   └── src/
│       ├── app.js               # registra ~25 routers + middlewares manualmente
│       ├── server.js            # connectDB() + app.listen()
│       ├── config/ (db, etc.)
│       ├── middlewares/         # auth, log, error, registrarAcao
│       ├── models/              # Pessoa, Cotacao-like, Omie, Moeda, Assistente, Log, ControleAlteracao...
│       ├── controllers/ services/ routers/ seeds/
│       └── docs/swagger/
└── projeto-scaffold-frontend/   # cópia completa do cst-multimoedas-frontend (React+Vite+Chakra)
    ├── src/App.jsx              # monta providers na mão
    ├── src/router.jsx          # mistura rotas core e de domínio
    ├── src/components/ pages/ hooks/ service/
    └── docs/CODEX_OONCORE_ABSTRACTION.md   # análise prévia (somente front)
```

Estado paralelo relevante (fora desta pasta): `projeto-npm-core/create-ooncore-back` e
`create-ooncore-front` já existem, mas **copiam o app inteiro e renomeiam** — abordagem antiga.
A v4 inverte isso: o Core vira **dependência npm**, e o projeto do cliente fica mínimo.

**Princípio-guia da v4:**

```txt
Central Oon = domínio do cliente + oonCore-back + oonCore-front + scaffold + deploy padrão
```

O que muda de fato:

| Dimensão            | Hoje (copiar tudo)                         | Alvo v4                                              |
| ------------------- | ------------------------------------------ | --------------------------------------------------- |
| Boot/infra          | Cada projeto tem `app.js`/`server.js`/`db` | Vive dentro de `@oondemand/oon-core-back`            |
| Rotas               | Registro manual no `app.js`                | Geradas pelo **Model Registry** a partir das models |
| Front               | `App.jsx` + `router.jsx` manuais           | `oonCore-front.start()` + render por metadata       |
| Projeto do cliente  | App completo                               | `central.config.js` + `src/models` (+ exceções)     |

---

## 1. Estratégia geral e ordem de execução

A migração segue a Seção 20 do requisito, em 4 fases. **Não recriar do zero**: mover o que já
existe em `projeto-scaffold-*` para dentro dos pacotes.

```txt
Fase 1: extrair Core do backend   ->  @oondemand/oon-core-back  (pacote + CLI)
Fase 2: reduzir backend exemplo   ->  Central de exemplo consumindo o Core
Fase 3: extrair Core do frontend  ->  @oondemand/oon-core-front (pacote + CLI)
Fase 4: criar gerador             ->  create-central-oon
```

Estrutura de trabalho sugerida (monorepo) dentro de `projeto-scaffold/`:

```txt
projeto-scaffold/
├── packages/
│   ├── oonCore-back/            # NOVO — extração do projeto-scaffold-backend
│   ├── oonCore-front/           # NOVO — extração do projeto-scaffold-frontend
│   └── create-central-oon/      # NOVO — gerador (substitui os create-ooncore-*)
├── examples/
│   └── central-exemplo/         # Central de teste (backend + frontend mínimos)
├── projeto-scaffold-backend/    # mantido como REFERÊNCIA durante a migração
└── projeto-scaffold-frontend/   # mantido como REFERÊNCIA durante a migração
```

> Recomendação: usar **npm/pnpm workspaces** para que `examples/central-exemplo` consuma os
> pacotes por symlink (`workspace:*`) sem publicar a cada iteração.

---

## 2. FASE 1 — `@oondemand/oon-core-back`

Objetivo: rodar uma Central completa com `oonCore-back start`, escrevendo apenas
`models / validations / triggers / hooks / mappings / pipelines / documents / integrations / routes`.

### 2.1 Criar o esqueleto do pacote

```txt
packages/oonCore-back/
├── package.json          # name: "@oondemand/oon-core-back", bin: { "oonCore-back": "bin/cli.js" }
├── bin/cli.js            # CLI: start | dev | activate | build:image | k8s:render | deploy
├── src/
│   ├── index.js          # exporta a API pública (define*, fields, omie, start)
│   ├── boot/             # bootstrap da app
│   ├── core/             # registry, factories, middlewares
│   ├── modules/          # omie, assistants, currencies, documents, pipelines
│   ├── deploy/           # docker + k8s templates + render
│   └── api/              # rotas /core/*
└── README.md
```

### 2.2 Migrar a infraestrutura (vem do `projeto-scaffold-backend/src`)

Mover para `src/boot` e `src/core`, removendo o acoplamento ao domínio:

| Origem (referência)                       | Destino no Core                          |
| ----------------------------------------- | ---------------------------------------- |
| `app.js` (Express, helmet, cors, json)    | `src/boot/createApp.js`                  |
| `server.js` (connectDB + listen)          | `src/boot/startServer.js`                |
| `config/db.js`                            | `src/boot/database.js`                   |
| `middlewares/authMiddleware.js`           | `src/core/middlewares/auth.js`           |
| `middlewares/logMiddleware.js`            | `src/core/middlewares/requestLog.js`     |
| `middlewares/errorMiddleware.js`          | `src/core/middlewares/error.js`          |
| `middlewares/registrarAcaoMiddleware.js`  | `src/core/middlewares/mutationAudit.js`  |
| `routers/authRouter.js`                   | `src/api/auth.routes.js`                 |
| `routers/seedRouter.js` + `seeds/`        | `src/boot/activation.js`                 |
| `routers/statusRouter.js`                 | `src/api/status.routes.js`               |
| `docs/swagger/`                           | `src/core/openapi/`                      |
| models `Log`, `ControleAlteracao`, `Sistema` | `src/core/models/` (models internas) |
| models/services `BaseOmie`, `Integracao`  | `src/modules/omie/`                      |
| models/services `Moeda`                   | `src/modules/currencies/`                |
| models/services `Assistente`              | `src/modules/assistants/`                |
| controllers/services genéricos de CRUD    | `src/core/factories/`                    |

> Regra: o que é **infra/transversal** sobe para o Core; o que é **domínio do CST** (Pessoa de
> negócio, Cotação, Serviço Tomado, DocumentoFiscal específico) **não** entra no Core — vira a
> Central de exemplo na Fase 2.

### 2.3 Implementar o **Model Registry** (coração técnico — Seção 17)

Cada `defineModel(...)` registra a model e gera derivações automaticamente:

```txt
defineModel  ->  Mongoose schema
                 CRUD (GET/POST/PUT/PATCH/DELETE + import/export)
                 auth + RBAC + paginação + filtros + busca + ordenação
                 validação base + sanitização
                 mutation audit + controle de alteração
                 OpenAPI + metadata para o front
                 hooks de IA / Omie / Multi-moedas
```

### 2.4 Implementar a API pública (`src/index.js`)

```js
module.exports = {
  start,             // sobe a aplicação (descobre central.config.js + src/*)
  defineCentral,     // lê modules + domain paths
  defineModel, fields,
  defineCollection, defineDocument, definePipeline,
  defineOmieMapping, defineRoutes, defineValidation, defineTrigger,
  omie,              // helper de sync usado em triggers
};
```

Contratos a respeitar (do requisito):

- `defineRoutes` expõe `router.private.*` e `router.public.*` — **nunca** `express.Router()` cru.
  `router.private` aplica obrigatoriamente auth + RBAC + log + mutation audit + correlationId.
- `fields` traz tipos prontos: `string`, `ref`, `enum`, `currency`, `currencyCode`, `currencyConverted`.

### 2.5 Rotas `/core/*` (contrato com o front — Seção 17 e 21)

```txt
GET /core/metadata     GET /core/models       GET /core/models/:name
GET /core/collections  GET /core/documents    GET /core/pipelines
GET /core/integrations GET /core/permissions  GET /core/actions
GET /core/menus        GET /core/features
```

### 2.6 Módulos opinativos do Core

- **Omie** (Seção 12): engine + filas + retry + webhooks; o dev só declara `defineOmieMapping` ou usa `omie.sync(...)`.
- **Assistentes IA** (Seção 13): catálogo, prompts, provedores, guardrails, mascaramento; o dev só declara `ai: { ... }` na model/pipeline.
- **Multi-moedas** (Seção 14): cadastro, cotação, conversão, endpoints e telas padrão; o dev só usa os `fields.currency*`.
- **Esteiras** (`definePipeline`, Seção 15) e **Documentos** (`defineDocument`, Seção 16).

### 2.7 CLI (`bin/cli.js`)

```bash
oonCore-back start        # produção
oonCore-back dev          # nodemon/watch
oonCore-back activate     # seed/ativação
oonCore-back build:image  # docker build
oonCore-back k8s:render   # renderiza manifests a partir de central.manifest.json
oonCore-back deploy       # aplica no cluster
```

### 2.8 Deploy embutido (Seção 18)

Templates de `Dockerfile`, `deployment/service/ingress/hpa/certificate/configmap/secret` ficam
**dentro do Core** em `src/deploy/templates/`. `k8s:render` gera os manifests a partir do
`central.manifest.json`. O consumidor não escreve YAML.

### 2.9 Critério de pronto da Fase 1

- [ ] `npm pack` gera o tarball do pacote sem arrastar domínio do CST.
- [ ] Uma model de teste com `crud.enabled` expõe os 6 endpoints + import/export.
- [ ] `GET /core/metadata` retorna a model registrada.
- [ ] Rota privada sem auth retorna 401; mutation gera registro em ControleAlteracao.

---

## 3. FASE 2 — Reduzir o backend a uma Central de exemplo

Transformar (uma cópia de) `projeto-scaffold-backend` em `examples/central-exemplo/backend`,
consumindo o Core. **Sai** do projeto (passa a viver no Core):

```txt
src/app.js  src/server.js  src/config/db.js
src/middlewares/*  routers/auth|seed|status  Dockerfile  k8s/  .github/workflows/deploy.yml
controllers/services genéricos de CRUD  omie/moedas/assistentes base
```

**Permanece** (domínio):

```txt
central.config.js
src/models  src/validations  src/triggers  src/hooks  src/mappings
src/pipelines  src/documents  src/collections
src/integrations/custom  src/routes/custom  src/controllers/custom  src/services/custom
```

`package.json` mínimo do consumidor:

```json
{
  "scripts": {
    "dev": "oonCore-back dev",
    "start": "oonCore-back start",
    "activate": "oonCore-back activate"
  },
  "dependencies": { "@oondemand/oon-core-back": "^1.0.0" }
}
```

`central.config.js` (Seção 8): só `name`, `slug`, `modules` e `domain` (paths). Sem db/auth/deploy.

Critério de pronto: `npm run dev` sobe a Central só com models + config, e o front antigo
continua conversando com os mesmos endpoints de domínio.

---

## 4. FASE 3 — `@oondemand/oon-core-front`

Extrair de `projeto-scaffold-frontend` o núcleo reutilizável (já há análise em
`projeto-scaffold-frontend/docs/CODEX_OONCORE_ABSTRACTION.md` — reaproveitar).

### 4.1 Esqueleto

```txt
packages/oonCore-front/
├── package.json   # name + bin: { "oonCore-front": "bin/cli.js" }
├── bin/cli.js     # dev | build | preview | sync:metadata
└── src/
    ├── index.js   # start(), define*Views, componentes Core*
    ├── shell/     # App, providers, theme, layouts, menu, guards
    ├── api/       # api client único (SDK REST do /core/*)
    └── components/# CoreCollection, CoreDocument, CorePipeline, CoreCurrency, CoreAssistant, CoreDashboard
```

### 4.2 Migrar (origem → Core)

| Origem (`projeto-scaffold-frontend/src`)          | Destino                         |
| ------------------------------------------------- | ------------------------------- |
| `App.jsx` (providers, query client, toaster)      | `src/shell/App.jsx` + `start()` |
| `router.jsx`                                      | route registry dirigido por metadata |
| `components/_layouts`, `menuList`                 | `src/shell/`                    |
| `components/dataGrid`, `buildForm`, `filter`      | `CoreCollection`                |
| `components/iaChat`, `selectAssistant`            | `CoreAssistant` + IA provider   |
| `pages/*` CRUD repetitivas                        | renderização dinâmica por model |
| `service/*` (axios)                               | `src/api/` (client único)       |

### 4.3 API pública

```js
export { start, defineCollectionView, defineDocumentView, definePipelineView, defineDashboard };
export { CoreCollection, CoreDocument, CorePipeline, CoreIntegration, CoreCurrency, CoreAssistant };
```

### 4.4 Três formas de declarar coleção (Seção 4)

1. JSON completo (`list.columns` + `form.fields`).
2. Registro mínimo (`model`, `path`, `label`).
3. 100% dinâmico: `<CoreCollection model="Pessoa" />` → consome `/core/models/Pessoa`,
   `/core/metadata`, `/core/permissions`, `/core/actions` e monta rota/menu/grid/form/ações sozinho.

### 4.5 CLI

```bash
oonCore-front dev      oonCore-front build
oonCore-front preview  oonCore-front sync:metadata   # baixa metadata do back e cacheia
```

Critério de pronto: `central.ui.json` (Seção 9) com uma coleção `mode: "dynamic"` renderiza a
tela completa **sem** páginas escritas à mão.

---

## 5. FASE 4 — `create-central-oon`

Gerador que cria backend + frontend mínimos a partir do nome da Central.

```bash
npx create-central-oon central-transtour
npx create-central-oon central-transtour --template=omie-sidecar
```

Estrutura gerada (Seção 5 / 25) — apenas pastas de domínio com `.gitkeep`, `central.config.js`,
`central.ui.json`, `central.manifest.json`, `package.json`, `README.md`. **Não** gera
`app.js/server.js/db.js`, middlewares, Dockerfile, k8s nem router manual.

Templates iniciais (Seção 20.4): `basic`, `omie-sidecar`, `servicos-tomados`,
`servicos-prestados`, `pedidos-marketplace`, `documentos-fiscais`, `multi-moedas`.

> Nota de consolidação: os pacotes `projeto-npm-core/create-ooncore-back` e `create-ooncore-front`
> hoje copiam o app inteiro. Eles devem ser **substituídos** por este `create-central-oon` (que
> gera só o esqueleto mínimo) ou reescritos para usar os templates acima.

---

## 6. Contrato back ↔ front (validar ponta a ponta)

```txt
Model/Manifest (backend) -> Model Registry -> GET /core/metadata -> oonCore-front
  -> telas, rotas, menus, forms, datagrids, esteiras, documentos
```

Teste de aceitação da plataforma: criar `Cotacao` só com `defineModel` no
`examples/central-exemplo/backend`, declarar `{ "model": "Cotacao", "mode": "dynamic" }` no
`central.ui.json` e ver a tela completa subir sem código de UI.

---

## 7. Segurança por design (invariantes — Seção 22, não negociáveis)

1. Rota privada sempre tem auth, contexto de usuário e log.
2. `POST/PUT/PATCH/DELETE` sempre geram auditoria (controle de alteração).
3. Dev não remove middleware obrigatório, não acessa secrets, não define db/ativação.
4. Dev não define engine de Omie/IA/Multi-moedas nem Docker/K8s como padrão.
5. Dev só escreve domínio, validação, gatilho e exceção.

Implementar como **testes automatizados** no `oonCore-back` para que regressões quebrem o build.

---

## 8. Checklist mestre

```txt
[x] Fase 1 — packages/oonCore-back
    [x] esqueleto + package.json + bin/cli.js
    [x] boot (app/server/db) extraído e des-acoplado
    [x] middlewares core (auth/log/error/mutationAudit)
    [x] Model Registry + factories (router/controller/service/CRUD)
    [x] fields (string/ref/enum/currency*)
    [x] API /core/* (metadata, models, permissions, actions, menus, features)
    [x] módulos: omie, assistants, currencies, documents, pipelines
    [x] deploy (docker + k8s render)
    [x] CLI: start/dev/activate/build:image/k8s:render/deploy
    [x] testes de invariantes de segurança
[x] Fase 2 — examples/central-exemplo/backend
    [x] remover infra/boot/middlewares/deploy
    [x] central.config.js + só domínio
    [x] sobe com `oonCore-back dev`
[x] Fase 3 — packages/oonCore-front
    [x] start() + shell/providers/layouts/menu
    [x] api client único do /core/*
    [x] Core* components + 3 modos de coleção
    [x] CLI: dev/build/preview/sync:metadata
[x] Fase 4 — packages/create-central-oon
    [x] gerador + templates (basic, omie-sidecar, ...)
    [x] consolidar/aposentar create-ooncore-back|front
[x] Validação ponta a ponta (Seção 6) — metadata real da Cotacao (/core/*) →
    derivação dinâmica do front (endpoint /cotacoes + colunas + form). Render
    headless da tela com happy-dom + Testing Library. Dev-auth validado em
    processo (401 sem token; passa com Bearer). Typecheck + testes verdes
    (back 5/5, front 10/10). Stack completa no navegador: examples/central-exemplo
    (docker-compose Mongo + roteiro README + seed.sh + DEV_FAKE_AUTH).
```

---

## 9. Decisões em aberto (confirmar antes de codar)

- **Monorepo vs. repos separados**: o requisito cita repos GitHub distintos (`ooncore-back`,
  `ooncore-front`). Sugestão: desenvolver em monorepo aqui e publicar para os repos no release.
- **JS vs. TS**: a base é JS; a doc do front sugere contratos tipáveis. Definir se o Core nasce em TS.
- **npm scope**: confirmar publicação em `@oondemand/*` (privado vs. público).
- **Destino dos `create-ooncore-*` atuais**: aposentar ou reescrever sobre `create-central-oon`.
