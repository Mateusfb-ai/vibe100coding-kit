#!/usr/bin/env node
// Roda TODOS os gates de scripts/gates.txt em paralelo, acumulando falhas, e
// reprova no fim.
//
// Uma cadeia `&&` para no primeiro vermelho e esconde os outros: "gates=0"
// passava a significar "nenhum reprovou até onde a cadeia chegou". Aqui todos
// rodam, sempre; o que se otimiza é o relógio (N = núcleos), nunca o conjunto.
// A saída de cada gate sai em bloco quando ele termina, para o relatório
// continuar legível.
//
// GATE EXCLUSIVO. Alguns gates não podem dividir o diretório com outro: os que
// compilam escrevem nos MESMOS arquivos de cache. Num projeto Next, `tsc
// --noEmit` e `next build` disputam `.next/types/**` e `tsconfig.tsbuildinfo`, e
// a corrida aparece como vermelho intermitente que aborta a integração e some
// quando se roda de novo. Quem está listado em `scripts/gates-exclusivos.txt`
// roda sozinho, um por vez, depois dos paralelos.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { cpus } from "node:os";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const ler = (arquivo) => {
  try { return readFileSync(path.join(RAIZ, "scripts", arquivo), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")); }
  catch { return []; }
};
const lista = ler("gates.txt");
const exclusivos = ler("gates-exclusivos.txt").filter((g) => lista.includes(g));
const paralelos = lista.filter((g) => !exclusivos.includes(g));
const N = Math.max(1, cpus().length);
let falhas = 0, feitos = 0;

async function rodar(linha) {
  return new Promise((resolve) => {
    const [cmd, ...args] = linha.split(" ");
    const p = spawn(cmd, args, { cwd: RAIZ, env: process.env });
    let saida = "";
    p.stdout.on("data", (d) => (saida += d));
    p.stderr.on("data", (d) => (saida += d));
    p.on("close", (code) => {
      feitos++;
      const ok = code === 0;
      if (!ok) falhas++;
      console.log(`${ok ? "✅" : "❌"} [${feitos}/${lista.length}] ${linha}`);
      if (!ok) console.log(saida.trim().split("\n").map((l) => `     ${l}`).join("\n"));
      resolve();
    });
  });
}

const fila = [...paralelos];
await Promise.all(Array.from({ length: N }, async () => { while (fila.length) await rodar(fila.shift()); }));
for (const g of exclusivos) await rodar(g);
console.log(`\ngates: ${lista.length} rodados, ${falhas} vermelho(s)`);
process.exit(falhas ? 1 : 0);
