"use strict";

const fs = require("node:fs");
const path = require("node:path");

/** Extensões tratadas como texto (recebem substituição de tokens). */
const TEXT_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".html",
  ".css",
  ".env",
  ".example",
  ".gitignore",
  ".gitkeep",
  ".yml",
  ".yaml",
]);

/** Nomes "seguros" no template -> dotfile real no destino gerado. */
const DOTFILE_MAP = {
  gitkeep: ".gitkeep",
  gitignore: ".gitignore",
  "env.example": ".env.example",
  npmrc: ".npmrc",
};

function isText(file) {
  if (path.basename(file).startsWith(".env")) return true;
  return TEXT_EXT.has(path.extname(file));
}

/** Substitui __NAME__ / __SLUG__ / __PASCAL__ no conteúdo. */
function applyTokens(content, tokens) {
  return content
    .replace(/__NAME__/g, tokens.name)
    .replace(/__SLUG__/g, tokens.slug)
    .replace(/__PASCAL__/g, tokens.pascal);
}

/**
 * Copia recursivamente `srcDir` para `destDir`, substituindo tokens em
 * arquivos de texto. Arquivos já existentes no destino são sobrescritos
 * (overlay): o template escolhido vence sobre o _base.
 */
function copyTemplate(srcDir, destDir, tokens) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    // Dotfiles ficam sem o ponto no template (npm não publica alguns dotfiles)
    // e recebem o ponto ao gerar.
    const destName = DOTFILE_MAP[entry.name] ?? entry.name;
    const to = path.join(destDir, destName);

    if (entry.isDirectory()) {
      copyTemplate(from, to, tokens);
    } else {
      const raw = fs.readFileSync(from);
      if (isText(from)) {
        fs.writeFileSync(to, applyTokens(raw.toString("utf8"), tokens));
      } else {
        fs.writeFileSync(to, raw);
      }
    }
  }
}

module.exports = { copyTemplate, applyTokens, isText };
