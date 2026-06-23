# Publicação no npm — pacotes `@oondemand/*`

Guia para publicar os pacotes deste monorepo (`@oondemand/oon-platform`) no npm.

Pacotes publicáveis (em `packages/*`):

| Pacote | Pasta | Build no publish? |
|---|---|---|
| `@oondemand/create-central-oon` | `packages/create-central-oon` | não (JS puro) |
| `@oondemand/oon-core-back` | `packages/oonCore-back` | não (JS puro) |
| `@oondemand/oon-core-front` | `packages/oonCore-front` | **sim** — `prepublishOnly: tsup` |

Todos têm `publishConfig.access: "public"` (são pacotes scoped `@oondemand`, que por padrão sairiam privados).

---

## Pré-requisitos

1. **Estar logado no npm** (login é interativo — abre navegador / pede dados):
   ```bash
   npm login
   npm whoami   # confirma o usuário logado
   ```

2. **2FA / OTP**: a conta exige autenticação de dois fatores. Cada `npm publish`
   pede um código do app autenticador, passado via `--otp=<codigo>`. O código
   expira em ~30s — gere um novo se demorar ou se publicar vários pacotes.

---

## ⚠️ Pegadinha: NÃO publique com `-w` a partir do root

O `package.json` do **root** tem `"private": true`. Rodar
`npm publish -w <pacote>` a partir do root faz o npm esbarrar nesse `private` e
abortar com:

```
npm error code EPRIVATE
npm error This package has been marked as private
```

**Solução:** publicar **de dentro da pasta de cada pacote** (`cd packages/<pkg>`),
assim o npm lê o `package.json` do próprio pacote (que é público).

---

## Passo a passo de um release

### 1. Subir a versão (bump)

De dentro da pasta do pacote, sem criar tag git automática:

```bash
cd packages/create-central-oon
npm version patch --no-git-tag-version   # 0.1.3 -> 0.1.4
```

(`patch` = 0.0.X, `minor` = 0.X.0, `major` = X.0.0)

> O npm recusa republicar uma versão já existente — sempre faça o bump antes.

### 2. Conferir o conteúdo do pacote (dry-run, não publica)

```bash
npm publish --dry-run --access public
```

Verifique `name`, `version`, `total files` e o tamanho do tarball.

### 3. Publicar de verdade

```bash
npm publish --access public --otp=<codigo-do-autenticador>
```

Para o `oon-core-front`, o publish dispara o build (`tsup`) automaticamente via
`prepublishOnly`; garanta que o build passa.

### 4. Verificar no registry

```bash
npm view @oondemand/create-central-oon version
```

---

## Exemplo: publicar os três pacotes (versão já bumpada)

Rode cada um de dentro da sua pasta. Use um OTP novo se algum expirar:

```bash
# create-central-oon
cd packages/create-central-oon && npm publish --access public --otp=<codigo>

# oon-core-back
cd ../oonCore-back && npm publish --access public --otp=<codigo>

# oon-core-front (roda tsup no prepublishOnly)
cd ../oonCore-front && npm publish --access public --otp=<codigo>
```

Conferir tudo de uma vez:

```bash
for p in @oondemand/create-central-oon @oondemand/oon-core-back @oondemand/oon-core-front; do
  printf "%-38s " "$p"; npm view "$p" version
done
```

---

## Depois de publicar

Commitar o bump de versão no git:

```bash
git add packages/*/package.json package-lock.json packages/*/package-lock.json
git commit -m "chore: release vX.Y.Z (...)"
git push
```
