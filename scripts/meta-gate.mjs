#!/usr/bin/env node
// META-GATE: prova que cada gate fica VERMELHO com o defeito que promete pegar.
//
//   npm run meta-gate
//
// Três conferências, e nenhuma delas roda gate por "parecer certo":
//   1. cobertura por CONTAGEM: todo gate de gates.txt tem pelo menos uma
//      mutação (ou está em gates-sem-mutacao.txt com o motivo). Ler a lista não
//      é enxergar os passos dela: um parser que descarta em silêncio já disse
//      "push liberado" vendo 184 de 247.
//   2. âncora VIVA: o trecho "de" casa exatamente uma vez no arquivo. Âncora
//      que envelheceu deixa o gate verde sem nunca ter sido exercitado.
//   3. injeção REAL: aplica a mutação, roda o gate, exige código != 0, restaura.
//      Enquanto o defeito está no disco, .kit-mutacao-em-voo.json marca a
//      árvore e o hook exige-tarefa recusa edição (a restauração apagaria a
//      edição sem rastro).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MUTACOES } from "./mutacoes.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const MARCA = path.join(RAIZ, ".kit-mutacao-em-voo.json");
let falhas = 0;
const ok = (cond, nome, porque) => {
  if (!cond) falhas++;
  console.log(`  ${cond ? "✅" : "❌"} ${nome}${cond ? "" : `\n     ↳ ${porque}`}`);
};

const lista = readFileSync(path.join(RAIZ, "scripts", "gates.txt"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
let isentos = [];
try { isentos = readFileSync(path.join(RAIZ, "scripts", "gates-sem-mutacao.txt"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")); } catch { /* opcional */ }

console.log(`\ncobertura: ${lista.length} gate(s) em gates.txt, ${MUTACOES.length} mutação(ões)`);
for (const gate of lista) {
  const tem = MUTACOES.some((m) => m.gate === gate) || isentos.includes(gate);
  ok(tem, gate, "sem mutação declarada em scripts/mutacoes.mjs (ou isenção com motivo em gates-sem-mutacao.txt)");
}

console.log("\nâncoras e injeção:");
for (const m of MUTACOES) {
  const arquivo = path.join(RAIZ, m.arquivo);
  if (!existsSync(arquivo)) { ok(false, `${m.gate} ← ${m.arquivo}`, "arquivo da mutação não existe"); continue; }
  const original = readFileSync(arquivo, "utf8");
  const vezes = original.split(m.de).length - 1;
  if (vezes !== 1) { ok(false, `${m.gate} ← ${m.arquivo}`, `a âncora "de" casa ${vezes}x (precisa ser exatamente 1): mutação virou papel`); continue; }

  const [cmd, ...args] = m.gate.split(" ");
  const antes = spawnSync(cmd, args, { cwd: RAIZ, encoding: "utf8" });
  if (antes.status !== 0) { ok(false, `${m.gate}`, `já está VERMELHO sem mutação; conserte o gate ou o fonte antes de provar`); continue; }

  writeFileSync(MARCA, JSON.stringify({ pid: process.pid, desde: new Date().toISOString(), arquivo: m.arquivo }));
  writeFileSync(arquivo, original.replace(m.de, m.para));
  let resultado;
  try {
    resultado = spawnSync(cmd, args, { cwd: RAIZ, encoding: "utf8" });
  } finally {
    writeFileSync(arquivo, original);
    rmSync(MARCA, { force: true });
  }
  ok(resultado.status !== 0, `${m.gate} ← ${m.arquivo}`, "o gate ficou VERDE com o defeito injetado: ele não pega o que promete");
}

console.log(`\nmeta-gate: ${falhas ? `${falhas} falha(s)` : "todos os gates provam o que prometem"}`);
process.exit(falhas ? 1 : 0);
