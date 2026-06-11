# central-exemplo (backend)

Central de exemplo da plataforma oonCore v4. Demonstra o alvo da **Fase 2**:
o backend é **só domínio** — não há `app.js`, `server.js`, `db.js`,
middlewares, Dockerfile, k8s nem router manual. Tudo isso vem de
[`@oondemand/oon-core-back`](../../../packages/oonCore-back).

## Estrutura (só domínio)

```
central-exemplo/backend/
├── central.config.js        # name, slug, modules, domain (Seção 8)
├── central.manifest.json    # valores de deploy (o Core renderiza o YAML)
├── package.json             # 3 scripts + 1 dependência (o Core)
└── src/
    ├── models/              # Pessoa, Servico, Cotacao  (defineModel)
    ├── validations/         # Pessoa                     (defineValidation)
    ├── triggers/            # Servico                     (defineTrigger + omie.sync)
    └── routes/              # relatorios                  (defineRoutes)
```

## Rodar

```bash
cp .env.example .env        # ajuste MONGO_URI e MEUS_APPS_BACKEND_URL
npm install                 # na raiz do monorepo (workspaces)
npm run dev                 # = oonCore-back dev
```

Isso sobe automaticamente, sem nenhum código de infra:

- `/pessoas`, `/servicos`, `/cotacoes` com CRUD completo + import/export
- `/relatorios/resumo` (rota privada customizada)
- `/core/metadata`, `/core/models`, `/core/permissions`, ... (contrato com o front)

## O que NÃO está aqui (vive no Core)

`app.js`, `server.js`, `config/db.js`, middlewares (auth/log/error/auditoria),
auth/seed/status routers, factories de CRUD, engines de Omie/Multi-moedas,
Dockerfile, manifests k8s e o workflow de deploy.
