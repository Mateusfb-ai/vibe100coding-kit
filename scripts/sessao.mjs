#!/usr/bin/env node
// Abre um diretório de trabalho só desta sessão: um worktree por tarefa.
//
//   npm run sessao -- <tipo>/<tarefa>      ex.: npm run sessao -- fix/preset-lento
//
// Várias sessões no MESMO diretório compartilham o HEAD: quem der checkout
// troca a branch de todo mundo, sem aviso. O worktree dá um HEAD por diretório
// mantendo uma configuração, um conjunto de remotes e os mesmos ganchos. O git
// recusa a mesma branch em duas árvores: a proteção é mecanismo, não lembrete.
import { existsSync } from "node:fs";
import path from "node:path";
import { git, gitQuieto, raizDoRepo, config } from "./_git.mjs";

const tarefa = process.argv[2];
if (!tarefa || !/^[a-z]+\/[a-z0-9._-]+$/.test(tarefa)) {
  console.error("uso: npm run sessao -- <tipo>/<tarefa>   (tipo: feature|fix|chore|docs|refactor|perf|style)");
  process.exit(64);
}
const raiz = raizDoRepo();
const cfg = config(raiz);
const destino = path.join(path.dirname(raiz), `${path.basename(raiz)}-${tarefa.replace("/", "-")}`);
if (existsSync(destino)) {
  console.log(`Já existe: ${destino}`);
  console.log(`\n  cd "${destino}"\n`);
  process.exit(0);
}
gitQuieto(raiz, "fetch", "origin", cfg.branchPrincipal, "--quiet");
const existe = gitQuieto(raiz, "rev-parse", "--verify", "--quiet", `refs/heads/${tarefa}`) !== "";
git(raiz, ...(existe ? ["worktree", "add", destino, tarefa] : ["worktree", "add", "-b", tarefa, destino, `origin/${cfg.branchPrincipal}`]));
git(raiz, "config", `branch.${tarefa}.${cfg.marca}`, "aberta");
console.log(`Pronto. Branch \`${tarefa}\` saída de origin/${cfg.branchPrincipal}${existe ? " (branch já existia)" : ""}, marcada como ABERTA.`);
console.log(`\n  cd "${destino}"\n`);
console.log("Trabalhe SÓ lá. Ao terminar: gates → commit → push → pergunte ao dono → npm run integrar.");
