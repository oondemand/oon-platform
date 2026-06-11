# @oondemand/create-central-oon

📖 **[Documentação completa → ooncoredoc.vercel.app](https://ooncoredoc.vercel.app)**

Gerador de **Centrais Oon**. Cria, a partir do nome da Central, um `backend/` e
um `frontend/` **mínimos** — só domínio e declaração — prontos para consumir o
Core (`@oondemand/oon-core-back` e `@oondemand/oon-core-front`).

Substitui os geradores legados `@oondemand/create-ooncore-back|front`, que
copiavam o app inteiro. Aqui só nasce o esqueleto: nada de `server.js`,
`app.js`, `db.js`, middlewares, Dockerfile, manifestos k8s à mão ou router
manual — isso tudo vive no Core.

## Uso

```bash
npx create-central-oon central-transtour
npx create-central-oon central-transtour --template=omie-sidecar
npx create-central-oon "Minha Loja" --template=multi-moedas --no-install
npx create-central-oon --list
```

Aliases: o binário também responde por `scaffold-central-oon`.

### Opções

| Flag             | Efeito                                                         |
| ---------------- | ------------------------------------------------------------- |
| `--template=<t>` | Template inicial (default: `basic`). Veja `--list`.           |
| `--here`         | Gera na pasta atual em vez de criar `<nome>/`.                |
| `--force`        | Sobrescreve uma pasta existente não-vazia.                    |
| `--no-install`   | Não roda `npm install` nos projetos gerados.                 |
| `--list`         | Lista os templates e sai.                                     |

## Templates

| Template              | O que gera                                                    |
| --------------------- | ------------------------------------------------------------- |
| `basic`               | Uma coleção dinâmica (`Pessoa`).                              |
| `omie-sidecar`        | Coleção + integração Omie (mapping de cliente + trigger).     |
| `servicos-tomados`    | Prestadores + esteira de serviços por `statusProcessamento`.  |
| `servicos-prestados`  | Clientes + esteira de serviços prestados por `etapa`.         |
| `pedidos-marketplace` | Catálogo de produtos + esteira de pedidos por `status`.       |
| `documentos-fiscais`  | Documento fiscal com aprovação (`CoreDocument`).              |
| `multi-moedas`        | `Moeda` + `Cotacao` com o módulo currencies.                  |

## Estrutura gerada

```txt
<central>/
├── README.md
├── backend/                 # consome @oondemand/oon-core-back
│   ├── central.config.js     # identidade + módulos + paths de domínio
│   ├── central.manifest.json # valores de deploy (render no Core)
│   └── src/{models,validations,triggers,hooks,mappings,documents,
│            pipelines,integrations,routes,controllers,services}/
└── frontend/                # consome @oondemand/oon-core-front
    ├── central.ui.json       # declaração das telas (coleções/esteiras/docs)
    └── src/
        ├── main.tsx          # só `startFromManifest(manifest, { apiBaseUrl })`
        └── {collections,documents,pipelines,dashboards,overrides}/
```

## Próximos passos após gerar

```bash
cd <central>/backend  && cp .env.example .env && npm run dev   # expõe /core/metadata
cd ../frontend        && cp .env.example .env && npm run dev   # renderiza pela metadata
```

Evoluir = criar models em `backend/src/models` e declarar telas em
`frontend/central.ui.json`. Grid, form, rotas e menu são montados pelo Core.
