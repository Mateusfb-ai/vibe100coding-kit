#!/usr/bin/env node
// Todo gate de package.json ("gate:*") está em gates.txt ou declarado como
// removido. É assim que gate não some da suíte sem ninguém ver.
import { readFileSync } from "node:fs";
import path from "node:path";
import { RAIZ, reprovar } from "./_arquivos.mjs";

const pkg = JSON.parse(readFileSync(path.join(RAIZ, "package.json"), "utf8"));
const lista = readFileSync(path.join(RAIZ, "scripts", "gates.txt"), "utf8");
let removidos = "";
try { removidos = readFileSync(path.join(RAIZ, "scripts", "gates-removidos.txt"), "utf8"); } catch { /* opcional */ }
const problemas = [];
for (const [nome, cmd] of Object.entries(pkg.scripts || {})) {
  if (!nome.startsWith("gate:")) continue;
  if (!lista.includes(cmd) && !removidos.includes(cmd)) problemas.push(`${nome} (${cmd}) não está em scripts/gates.txt nem em gates-removidos.txt`);
}
reprovar("lista-de-gates", problemas);
