#!/usr/bin/env node
// Integra a tarefa na branch principal validando DEPOIS do rebase.
//
//   npm run integrar
//
// A invariante, e é só ela: o que sobe é exatamente o que foi validado.
// fetch → rebase → gates SOBRE A BASE NOVA → push. Push rejeitado (a main
// andou) reinicia do fetch, nunca dos gates. Conflito ele NÃO resolve: aborta
// e devolve, porque conflito são dois códigos VÁLIDOS e válido não é aprovado
// (foi assim que um rebase de 65 commits apagou três peças aprovadas passando
// em todos os gates).
//
// Uma integração por vez na máquina: fila FIFO por ticket no .git comum. O git
// já serializa o push; a fila corta o desperdício de N suítes rodando juntas
// para N-1 serem jogadas fora.
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { git, gitQuieto, config } from "./_git.mjs";

const cwd = process.cwd();
const cfg = config(cwd);
const principal = cfg.branchPrincipal;
const TENTATIVAS = 3;

const branch = git(cwd, "rev-parse", "--abbrev-ref", "HEAD");
if (branch === principal || branch === "HEAD") { console.error(`Você está em \`${branch}\`. Integrar é levar uma TAREFA para a ${principal}.`); process.exit(1); }
const sujos = gitQuieto(cwd, "status", "--porcelain").split("\n").filter(Boolean);
if (sujos.length) { console.error("Há trabalho não salvo. Commite antes de integrar:"); sujos.slice(0, 10).forEach((s) => console.error(`  ${s}`)); process.exit(1); }

// ---- fila FIFO por máquina (ticket no .git comum, morto = sem sinal há 90 s)
const pastaFila = path.join(git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir"), "kit-fila-de-integracao");
mkdirSync(pastaFila, { recursive: true });
const meuTicket = path.join(pastaFila, `${Date.now()}-${process.pid}.json`);
const bater = () => writeFileSync(meuTicket, JSON.stringify({ pid: process.pid, branch, vivo: Date.now() }));
bater();
const batimento = setInterval(bater, 5000);
const sairDaFila = () => { clearInterval(batimento); try { rmSync(meuTicket); } catch { /* já saiu */ } };
process.on("exit", sairDaFila);
for (;;) {
  const tickets = readdirSync(pastaFila).filter((f) => f.endsWith(".json")).sort().map((f) => {
    try { return { f, ...JSON.parse(readFileSync(path.join(pastaFila, f), "utf8")) }; } catch { return null; }
  }).filter(Boolean);
  for (const t of tickets) {
    let vivo = true; try { process.kill(t.pid, 0); } catch { vivo = false; }
    if (!vivo || Date.now() - t.vivo > 90_000) { try { rmSync(path.join(pastaFila, t.f)); } catch { /* sumiu */ } }
  }
  const fila = readdirSync(pastaFila).filter((f) => f.endsWith(".json")).sort();
  const posicao = fila.indexOf(path.basename(meuTicket));
  if (posicao <= 0) break;
  console.log(`[fila] você é o ${posicao + 1}º de ${fila.length}. UMA integração por vez nesta máquina; esperando.`);
  await new Promise((r) => setTimeout(r, 5000));
}

const [cmd, ...args] = (cfg.gates || "npm run gates").split(" ");
for (let vez = 1; vez <= TENTATIVAS; vez++) {
  console.log(`\n[integrar] tentativa ${vez}/${TENTATIVAS}`);
  git(cwd, "fetch", "origin", principal, "--quiet");
  if (gitQuieto(cwd, "rev-list", "--count", `origin/${principal}..${branch}`) === "0") { console.log(`[integrar] nada fora da ${principal}. Nada a fazer.`); process.exit(0); }

  const rebase = spawnSync("git", ["rebase", `origin/${principal}`], { cwd, encoding: "utf8" });
  if (rebase.status !== 0) {
    const conflitados = gitQuieto(cwd, "diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    gitQuieto(cwd, "rebase", "--abort");
    if (!conflitados.length) { console.error(`\n[integrar] o rebase NÃO COMEÇOU (árvore suja ou outro motivo):\n${(rebase.stderr || rebase.stdout || "").trim()}`); process.exit(1); }
    console.error("\n[integrar] CONFLITO: parei e desfiz o rebase. Nada foi alterado.\n");
    conflitados.forEach((c) => console.error(`  ${c}`));
    console.error(`\nResolva à mão: conflito são dois códigos VÁLIDOS, e válido não é aprovado.\n\n  git rebase origin/${principal}\n  (resolva)\n  npm run integrar\n`);
    process.exit(1);
  }

  console.log("[integrar] rebase feito. Rodando os gates SOBRE A BASE NOVA…");
  const gates = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (gates.status !== 0) { console.error("\n[integrar] gates vermelhos sobre a base nova. Nada foi publicado."); process.exit(1); }

  const push = spawnSync("git", ["push", "origin", `${branch}:${principal}`], { cwd, encoding: "utf8" });
  if (push.status === 0) {
    gitQuieto(cwd, "push", "origin", branch, "--quiet");
    console.log(`\n[integrar] publicado na ${principal}: ${git(cwd, "rev-parse", "--short", "HEAD")}`);
    console.log("Push aceito não é deploy feito: confira o alias/ambiente. Depois: npm run tarefa -- concluir");
    process.exit(0);
  }
  console.log(`[integrar] push rejeitado (a ${principal} andou). Reiniciando do fetch.`);
}
console.error(`[integrar] ${TENTATIVAS} tentativas sem conseguir publicar. A ${principal} está andando rápido; tente de novo.`);
process.exit(1);
