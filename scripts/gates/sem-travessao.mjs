#!/usr/bin/env node
// Nenhum travessão (— –) em texto que a pessoa lê: dicionário de i18n, copy,
// e-mail, tela. Vírgula, dois pontos, ponto ou parênteses no lugar.
// Pastas: kit.json → "pastasDeTexto" (padrão: src). Prosa interna fica livre.
import { readFileSync } from "node:fs";
import path from "node:path";
import { RAIZ, config, listar, reprovar } from "./_arquivos.mjs";

const pastas = [...(config().pastasDeTexto || config().pastasLimpas || ["src"]), "scripts/gates/_fixtures/texto"];
const problemas = [];
for (const arq of listar(pastas, [".ts", ".tsx", ".js", ".jsx", ".json", ".swift", ".html", ".vue", ".svelte"])) {
  readFileSync(arq, "utf8").split("\n").forEach((l, i) => {
    if (/[—–]/.test(l)) problemas.push(`${path.relative(RAIZ, arq)}:${i + 1} travessão`);
  });
}
reprovar("sem-travessao", problemas);
