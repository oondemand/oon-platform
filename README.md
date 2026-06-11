# OonCore Platform

Monorepo da plataforma **OonCore** — infraestrutura para construir Centrais operacionais (sistemas internos orientados a dados) de forma rápida, padronizada e segura.

📖 **[Documentação completa → ooncoredoc.vercel.app](https://ooncoredoc.vercel.app)**

---

## Pacotes

| Pacote | npm | Descrição |
|--------|-----|-----------|
| `@oondemand/oon-core-back` | [![npm](https://img.shields.io/npm/v/@oondemand/oon-core-back)](https://www.npmjs.com/package/@oondemand/oon-core-back) | Runtime Express/Mongoose — CRUD automático, RBAC, módulos, deploy |
| `@oondemand/oon-core-front` | [![npm](https://img.shields.io/npm/v/@oondemand/oon-core-front)](https://www.npmjs.com/package/@oondemand/oon-core-front) | Shell React — providers, roteamento por metadata, componentes Core* |
| `@oondemand/create-central-oon` | [![npm](https://img.shields.io/npm/v/@oondemand/create-central-oon)](https://www.npmjs.com/package/@oondemand/create-central-oon) | CLI scaffold — gera uma Central completa em segundos |

---

## Início rápido

```bash
npx @oondemand/create-central-oon minha-central
cd minha-central/backend  && cp .env.example .env && npm run dev
cd ../frontend            && cp .env.example .env && npm run dev
```

Em menos de 5 minutos você tem um sistema com CRUD, autenticação, RBAC e interface pronta — sem escrever uma linha de infraestrutura.

→ [Guia completo de Quickstart](https://ooncoredoc.vercel.app/quickstart)

---

## Como funciona

Você escreve **apenas o domínio**. O Core resolve o resto.

```
Central (seu código)
├── backend/src/models/Cliente.js     ← defineModel(...)
├── backend/src/validations/...       ← defineValidation(...)
├── backend/src/triggers/...          ← defineTrigger(...)
└── frontend/central.ui.ts            ← defineCollectionView(...)

@oondemand/oon-core-back              ← CRUD, auth, RBAC, paginação, auditoria
@oondemand/oon-core-front             ← shell, router, tabelas, forms, SDK REST
```

---

## Estrutura do monorepo

```
projeto-scaffold/
├── packages/
│   ├── oon-core-back/          # @oondemand/oon-core-back
│   ├── oon-core-front/         # @oondemand/oon-core-front
│   └── create-central-oon/     # @oondemand/create-central-oon
├── examples/
│   └── central-exemplo/        # Central de referência (backend + frontend)
├── website/                    # Documentação (Docusaurus)
└── package.json                # Monorepo root (npm workspaces)
```

---

## Desenvolvimento local

### Instalar todas as dependências

```bash
npm install
```

### Rodar os testes do core back

```bash
npm run test:core
```

### Typecheck do core front

```bash
npm run typecheck:front
```

### Build do core front

```bash
npm run build
```

### Subir a central de exemplo

```bash
npm run dev:exemplo        # backend → localhost:3000
npm run dev:exemplo-front  # frontend → localhost:5173
```

### Documentação local

```bash
cd website && npm start    # → localhost:3000
```

---

## Publicar no npm

```bash
# 1. Bump de versão (sincroniza os 3 pacotes)
npm run version:patch   # ou :minor / :major

# 2. Publicar
npm run publish:all -- --otp=SEU_CODIGO_2FA
```

---

## Templates disponíveis

| Template | Caso de uso |
|----------|-------------|
| `basic` | Coleção dinâmica simples |
| `omie-sidecar` | Integração com ERP Omie |
| `servicos-tomados` | Serviços com esteira de status |
| `servicos-prestados` | Serviços prestados com etapas |
| `pedidos-marketplace` | Pedidos com esteira de fulfillment |
| `documentos-fiscais` | Documentos com aprovação |
| `multi-moedas` | Cotações com conversão automática |

```bash
npx @oondemand/create-central-oon minha-central --template=omie-sidecar
npx @oondemand/create-central-oon --list   # ver todos
```

→ [Catálogo completo de templates](https://ooncoredoc.vercel.app/scaffold/templates)

---

## Links

- 📖 [Documentação](https://ooncoredoc.vercel.app)
- 📦 [npm — @oondemand](https://www.npmjs.com/org/oondemand)
- 🌐 [oondemand.com.br](https://oondemand.com.br)
