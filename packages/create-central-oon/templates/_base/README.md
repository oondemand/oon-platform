# __NAME__

Central Oon gerada com `create-central-oon`. É composta por dois projetos
mínimos que consomem o Core:

- **backend/** — só domínio (`src/models`, `validations`, `triggers`, …).
  Sobe com `oonCore-back dev`. Toda a infra (boot, db, auth, RBAC, metadata,
  CRUD, deploy) vem do `@oondemand/oon-core-back`.
- **frontend/** — só declaração (`central.ui.json`). Sobe com `oonCore-front
  dev`. Shell, providers, roteamento, auth e telas vêm do
  `@oondemand/oon-core-front`, renderizados a partir do `/core/metadata` do back.

## Rodando

```bash
# backend
cd backend && cp .env.example .env && npm install && npm run dev

# frontend (noutro terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

## Evoluindo a Central

1. Crie models em `backend/src/models` (só schema + CRUD).
2. Declare as telas em `frontend/central.ui.json` (coleções/esteiras/documentos).
3. O resto — grid, form, rotas, menu — é montado pelo Core automaticamente.
