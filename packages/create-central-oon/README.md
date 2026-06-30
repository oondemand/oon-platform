# @oondemand/create-central-oon

📖 **[Documentação completa → ooncoredoc.vercel.app](https://ooncoredoc.vercel.app)**

Gerador de **Centrais Oon**. Cria, a partir do nome da Central, um `backend/` de domínio e um `frontend/` declarativo prontos para consumir o Core (`@oondemand/oon-core-back` e `@oondemand/oon-core-front`).

Toda Central gerada nasce com o padrão visual e operacional consolidado na **Central Minexco**:

- identidade visual Oon/CST com Poppins, azul `#0474AF` e fundo `#F8F9FA`;
- menu lateral compacto, responsivo e agrupado por seções;
- datagrids densos com busca, ordenação, paginação, badges e ações;
- formulários em diálogo, duas colunas e validação detalhada por campo;
- campos relacionados com seleção pesquisável;
- esteiras horizontais com colunas `#E8ECEF` e cartões operacionais brancos.

O padrão fica no `@oondemand/oon-core-front`; os templates funcionais apenas declaram domínio, coleções, documentos e esteiras. Assim, não é necessário copiar ou manter um frontend diferente para cada Central.

## Uso

```bash
npx create-central-oon central-transtour
npx create-central-oon central-transtour --template=omie-sidecar
npx create-central-oon "Minha Loja" --template=multi-moedas --no-install
npx create-central-oon --list
```

Aliases: o binário também responde por `scaffold-central-oon`.

### Opções

| Flag             | Efeito                                                        |
| ---------------- | ------------------------------------------------------------- |
| `--template=<t>` | Template funcional inicial (default: `basic`). Veja `--list`. |
| `--here`         | Gera na pasta atual em vez de criar `<nome>/`.                |
| `--force`        | Sobrescreve uma pasta existente não-vazia.                    |
| `--no-install`   | Não roda `npm install` nos projetos gerados.                  |
| `--list`         | Lista os templates e sai.                                     |

## Templates funcionais

Todos utilizam o mesmo frontend padrão Minexco.

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
├── backend/                  # consome @oondemand/oon-core-back
│   ├── central.config.js     # identidade + módulos + paths de domínio
│   ├── central.manifest.json # valores de deploy (render no Core)
│   └── src/{models,validations,triggers,hooks,mappings,documents,
│            pipelines,integrations,routes,controllers,services}/
└── frontend/                 # consome o frontend padrão Minexco do OonCore
    ├── central.ui.json       # menu e telas (coleções/esteiras/documentos)
    └── src/
        ├── main.tsx          # startFromManifest(manifest, { apiBaseUrl })
        └── {collections,documents,pipelines,dashboards,overrides}/
```

## Próximos passos após gerar

```bash
cd <central>/backend  && cp .env.example .env && npm run dev
cd ../frontend        && cp .env.example .env && npm run dev
```

Evoluir a Central significa criar models em `backend/src/models` e declarar as telas em `frontend/central.ui.json`. Menu, rotas, datagrids, formulários e esteiras são montados pelo Core mantendo o padrão Minexco.
