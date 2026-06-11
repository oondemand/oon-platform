# Central Exemplo — rodar a stack no navegador

Demonstra a plataforma oonCore ponta a ponta: um **backend** só de domínio
(`@oondemand/oon-core-back`) e um **frontend** só de declaração
(`@oondemand/oon-core-front`). O critério de pronto é ver a coleção **Cotacao**
em `mode: "dynamic"` renderizar a tela completa — grid, formulário, paginação —
sem nenhuma página escrita à mão.

```
backend/  → expõe /core/metadata + CRUD (Mongo)
frontend/ → lê a metadata e monta as telas (central.ui.ts)
```

## Pré-requisitos

- Node 18+
- Docker (para o Mongo) — ou um MongoDB local já rodando
- Dependências instaladas no monorepo: `npm install` na raiz `projeto-scaffold/`

## Passo a passo

Rode cada bloco em um terminal separado, a partir desta pasta
(`examples/central-exemplo/`).

### 1. Subir o Mongo

```bash
docker compose up -d
# Mongo em localhost:27017 (e mongo-express opcional em http://localhost:8081)
```

> Sem Docker? Aponte `MONGO_URI` para o seu Mongo no `.env` do backend.

### 2. Backend (oonCore-back)

```bash
cd backend
cp .env.example .env          # já vem com DEV_FAKE_AUTH=true para rodar sem Meus Apps
npm run dev                   # sobe em http://localhost:4000
```

Confira a metadata:

```bash
curl -s http://localhost:4000/core/metadata | npx --yes json | head
```

> **Auth de dev:** o `.env.example` liga `DEV_FAKE_AUTH=true`. Com isso o
> backend aceita qualquer token e resolve um usuário admin local — necessário
> porque as rotas CRUD são privadas. **Nunca** ligue isso em produção (sem a
> env, volta a usar o provedor Meus Apps).

### 3. Popular dados (opcional, mas recomendado)

```bash
./seed.sh                     # cria 1 Pessoa + 2 Cotações via API
```

### 4. Frontend (oonCore-front)

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm run dev                   # sobe em http://localhost:5173
```

### 5. Abrir no navegador com um token de sessão

O frontend valida a sessão antes de abrir. Como estamos sem Meus Apps, semeie
um token de dev abrindo **uma vez** com `?code=`:

```
http://localhost:5173/?code=dev
```

O Core captura o `code`, guarda como token, limpa a URL e valida no backend
(que, com `DEV_FAKE_AUTH`, devolve o admin local). A partir daí navegue normal.

## O que você deve ver

- **Visão geral** (dashboard): contadores de Prestadores, Serviços e Cotações.
- **Cotações** (`/cotacoes`): grid com colunas **derivadas da metadata**
  (Cliente, Descrição, Valor, Moeda, Status), busca, paginação e o botão
  **Novo** abrindo um formulário gerado a partir dos campos da model — tudo
  sem código de UI por entidade.
- **Prestadores** e a esteira de **Serviços tomados** (kanban por
  `statusProcessamento`).

Edite `backend/src/models/Cotacao.js` (adicione um campo) e recarregue: a coluna
e o campo do formulário aparecem sozinhos. Esse é o ponto da plataforma.

## Derrubar tudo

```bash
docker compose down       # mantém os dados
docker compose down -v    # apaga os dados do Mongo
```
