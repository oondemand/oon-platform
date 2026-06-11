# @oondemand/oon-core-front

📖 **[Documentação completa → ooncoredoc.vercel.app](https://ooncoredoc.vercel.app)**

Core de **frontend** para Centrais Oon. Uma Central de frontend passa a ser
apenas **declaração**: você escreve um `central.ui.ts` (identidade + views) e
sobe tudo com `oonCore-front dev`.

Todo o resto — bootstrap, providers (React Query + Chakra), roteamento por
metadata, autenticação, RBAC, layout, menu, SDK REST único do `/core/*`,
auditoria e os componentes `Core*` (Coleção, Documento, Esteira, Multi-moedas,
Assistente, Dashboard) — vive aqui dentro.

É o par de frontend do [`@oondemand/oon-core-back`](../oonCore-back): o back
descreve as models em `/core/metadata`; o front monta as telas a partir disso,
sem código de UI por entidade.

## Instalação

```bash
npm install @oondemand/oon-core-front
# peers: react, react-dom, react-router-dom, @tanstack/react-query,
#        @tanstack/react-table, @chakra-ui/react
```

## Uso mínimo

`central.ui.ts`:

```ts
import { defineCollectionView, type OonCoreFrontConfig } from "@oondemand/oon-core-front";

export const appConfig: OonCoreFrontConfig = {
  app: { id: "minha-central", name: "Minha Central" },
  api: { baseUrl: import.meta.env.VITE_API_URL },
  auth: { mode: "bearer", tokenParam: "code" },
  ui: {
    views: [
      // 100% dinâmico: nada além do nome da model. Grid, form, rota e menu
      // são montados a partir de /core/models/Cotacao.
      defineCollectionView({ model: "Cotacao", mode: "dynamic" }),
    ],
  },
};
```

`src/main.tsx`:

```ts
import { start } from "@oondemand/oon-core-front";
import { appConfig } from "../central.ui";

start(appConfig);
```

`main.tsx` não conhece providers, router, auth, layout, menu nem serviços.

## Três formas de declarar uma coleção (Seção 4.4)

```ts
// 1. JSON completo — colunas e form explícitos (mode "full").
defineCollectionView({
  model: "Pessoa",
  mode: "full",
  columns: [{ field: "nome", label: "Nome", sortable: true }],
  form: [{ field: "nome", label: "Nome", required: true }],
});

// 2. Registro mínimo — só model + label; Core deriva tudo da metadata.
defineCollectionView({ model: "Pessoa", label: "Prestadores", mode: "minimal" });

// 3. 100% dinâmico — consome /core/models/Pessoa e monta sozinho.
defineCollectionView({ model: "Pessoa", mode: "dynamic" });
```

Ou direto no JSX, sem registrar view:

```tsx
import { CoreCollection } from "@oondemand/oon-core-front";

<CoreCollection model="Pessoa" />;
```

## CLI

```bash
oonCore-front dev             # vite dev
oonCore-front build           # vite build
oonCore-front preview         # vite preview
oonCore-front sync:metadata   # baixa /core/metadata do back e cacheia em src/.oon/metadata.json
```

## Componentes Core

| Componente       | Para quê                                                            |
| ---------------- | ------------------------------------------------------------------- |
| `CoreCollection` | CRUD genérico: grid + form (3 modos).                               |
| `CoreDocument`   | Tipos documentais com aprovação/anexos sobre a coleção.             |
| `CorePipeline`   | Esteira kanban agrupada por etapa (enum da metadata).               |
| `CoreCurrency`   | Multi-moedas: lista + ação `actions/update-rates`.                  |
| `CoreIntegration`| Painel de `/core/integrations` + reprocessar ativos.               |
| `CoreAssistant`  | Chat de IA seguro — envia só `assistantCode`/`entity`/`message`.    |
| `CoreDashboard`  | Widgets `count`/`sum`/`custom` declarados na Central.               |

## Segurança por design

- **Sem segredos no front**: o assistente nunca envia chave de IA — só
  `assistantCode`, `entity` e `message`; o back resolve modelo/prompt/chave.
- **Token encapsulado** em `tokenStorage` (try/catch, captura de `?code=` e
  limpeza da URL); 401 dispara logout + redirect para o login externo.
- **RBAC de UX**: `RouteGuard`/`PermissionGate` escondem o que o usuário não
  pode usar — o back continua sendo a autoridade final.
- **Auditoria**: toda mutação leva headers `x-oon-origin/module/entity`.

## Contrato com o back

| `/core/*` (back)        | Uso no front                                   |
| ----------------------- | ---------------------------------------------- |
| `GET /core/metadata`    | `useCoreMetadata()` — menu/dashboard/derivação |
| `GET /core/models/:n`   | `useModelSchema(n)` — modo dynamic             |
| CRUD em `basePath`      | `useOonResource(basePath)` — list/get/CRUD     |
| `GET /auth/validar-token` | `AuthProvider` resolve o usuário             |
