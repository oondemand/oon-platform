#!/usr/bin/env bash
# Popula a Central Exemplo com dados de demonstração (1 Pessoa + 2 Cotações).
# Requer o backend rodando com DEV_FAKE_AUTH=true. Uso: ./seed.sh
set -euo pipefail

API="${VITE_API_URL:-http://localhost:4000}"
TOKEN="${DEV_TOKEN:-dev}"
AUTH="Authorization: Bearer ${TOKEN}"

echo "→ Criando Pessoa..."
PESSOA_ID=$(curl -s -X POST "$API/pessoas" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"nome":"Cliente Demo","email":"demo@local","tipo":"pj","status":"ativo"}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);console.log((o.pessoa||o)._id||"")})')

if [ -z "$PESSOA_ID" ]; then echo "✖ Falha ao criar Pessoa (backend no ar? DEV_FAKE_AUTH=true?)"; exit 1; fi
echo "  Pessoa: $PESSOA_ID"

echo "→ Criando Cotações..."
curl -s -X POST "$API/cotacoes" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"cliente\":\"$PESSOA_ID\",\"descricao\":\"Proposta de câmbio USD\",\"valor\":1500,\"moeda\":\"USD\",\"status\":\"enviada\"}" >/dev/null
curl -s -X POST "$API/cotacoes" -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"cliente\":\"$PESSOA_ID\",\"descricao\":\"Proposta de câmbio EUR\",\"valor\":2300,\"moeda\":\"EUR\",\"status\":\"aprovada\"}" >/dev/null

echo "✔ Seed concluído. Abra o frontend e veja a coleção Cotacao."
