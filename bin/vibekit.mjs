#!/usr/bin/env node
// vibekit init [pasta]   instala o kit num projeto SEM sobrescrever o que já existe
// vibekit doctor [pasta] confere o que está instalado e o que falta
//
// `init` é aditivo por construção: cada arquivo só é copiado se não existir, e
// os hooks entram em .claude/settings.json por merge (o que já estava lá fica).
// Ferramenta que gera harness por cima de um .claude/ afinado por meses é
// ferramenta de projeto novo; esta serve nos dois casos.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [acao = "help", destinoArg = "."] = process.argv.slice(2);
const DEST = path.resolve(destinoArg);

const copiados = [], mantidos = [];
function copiar(rel, para = rel) {
  const de = path.join(KIT, rel), ate = path.join(DEST, para);
  if (statSync(de).isDirectory()) {
    for (const e of readdirSync(de)) copiar(path.join(rel, e), path.join(para, e));
    return;
  }
  if (existsSync(ate)) { mantidos.push(para); return; }
  mkdirSync(path.dirname(ate), { recursive: true });
  cpSync(de, ate);
  copiados.push(para);
}

function mesclarSettings() {
  const alvo = path.join(DEST, ".claude", "settings.json");
  const meus = JSON.parse(readFileSync(path.join(KIT, ".claude", "settings.json"), "utf8"));
  let atual = {};
  try { atual = JSON.parse(readFileSync(alvo, "utf8")); } catch { /* novo */ }
  atual.hooks = atual.hooks || {};
  for (const [evento, entradas] of Object.entries(meus.hooks)) {
    const lista = atual.hooks[evento] || [];
    for (const e of entradas) {
      const cmd = e.hooks[0].command;
      if (!JSON.stringify(lista).includes(cmd)) lista.push(e);
    }
    atual.hooks[evento] = lista;
  }
  mkdirSync(path.dirname(alvo), { recursive: true });
  writeFileSync(alvo, JSON.stringify(atual, null, 2) + "\n");
}

function mesclarPackage() {
  const alvo = path.join(DEST, "package.json");
  let pkg = { name: path.basename(DEST), version: "0.0.0", private: true, type: "module", scripts: {} };
  try { pkg = JSON.parse(readFileSync(alvo, "utf8")); } catch { /* novo */ }
  pkg.scripts = pkg.scripts || {};
  const meus = JSON.parse(readFileSync(path.join(KIT, "package.json"), "utf8")).scripts;
  for (const nome of ["sessao", "tarefa", "integrar", "gates", "gate:sem-comentario", "gate:sem-travessao", "gate:lista-de-gates", "meta-gate"]) {
    if (!pkg.scripts[nome]) pkg.scripts[nome] = meus[nome];
  }
  writeFileSync(alvo, JSON.stringify(pkg, null, 2) + "\n");
}

if (acao === "init") {
  copiar(".claude/hooks");
  copiar(".claude/rules");
  copiar(".claude/skills");
  copiar("scripts");
  copiar("templates/kit.json", "kit.json");
  copiar("templates/CLAUDE.md", "CLAUDE.md");
  copiar("templates/REGRA.md", "docs/REGRA.md");
  copiar("templates/CEREBRO-AGENTE.md", "docs/CEREBRO-AGENTE.md");
  copiar("templates/DECISOES.md", "docs/DECISOES.md");
  copiar("templates/learnings/TEMPLATE.md", "learnings/TEMPLATE.md");
  copiar("templates/specs/TEMPLATE.md", "specs/TEMPLATE.md");
  mesclarSettings();
  mesclarPackage();
  console.log(`vibekit: instalado em ${DEST}`);
  if (copiados.length) console.log(`  copiados (${copiados.length}):\n    ` + copiados.join("\n    "));
  if (mantidos.length) console.log(`  já existiam, mantidos (${mantidos.length}):\n    ` + mantidos.join("\n    "));
  console.log("\nPróximos passos:\n  1. edite kit.json (nome, o que o produto é, regras e pastas limpas)\n  2. preencha CLAUDE.md (contexto, comandos, erros recorrentes)\n  3. npm run meta-gate && npm run gates\n  4. abra o Claude Code: os hooks já valem na próxima sessão");
} else if (acao === "doctor") {
  const itens = [
    [".claude/hooks/session-rules.cjs", "hook SessionStart"],
    [".claude/hooks/skill-suggest.cjs", "hook UserPromptSubmit"],
    [".claude/hooks/exige-tarefa.cjs", "hook PreToolUse"],
    [".claude/hooks/fim-de-tarefa.cjs", "hook Stop"],
    [".claude/settings.json", "hooks registrados"],
    [".claude/rules/ondas-paralelas.md", "regra de ondas"],
    ["scripts/tarefa.mjs", "ciclo de tarefa"],
    ["scripts/integrar.mjs", "integração com rebase antes"],
    ["scripts/rodar-gates.mjs", "runner de gates"],
    ["scripts/meta-gate.mjs", "meta-gate"],
    ["scripts/gates.txt", "lista de gates"],
    ["kit.json", "config do projeto"],
    ["CLAUDE.md", "manual da sessão"],
    ["docs/CEREBRO-AGENTE.md", "como raciocinar"],
    ["learnings", "lei do aprendizado"],
    ["graphify-out/graph.json", "grafo do código (opcional: graphify .)", true],
  ];
  let faltam = 0;
  for (const [rel, oque, opcional] of itens) {
    const tem = existsSync(path.join(DEST, rel));
    if (!tem && !opcional) faltam++;
    console.log(`  ${tem ? "✅" : opcional ? "➖" : "❌"} ${rel.padEnd(36)} ${oque}`);
  }
  console.log(faltam ? `\n${faltam} item(ns) faltando. Rode: npx github:Mateusfb-ai/vibe100coding-kit init` : "\nTudo no lugar.");
  process.exit(faltam ? 1 : 0);
} else {
  console.log("uso:\n  npx vibe100coding-kit init [pasta]     instala sem sobrescrever\n  npx vibe100coding-kit doctor [pasta]   confere a instalação");
}
