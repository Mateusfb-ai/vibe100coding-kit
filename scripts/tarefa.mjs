#!/usr/bin/env node
// O ciclo de UMA tarefa dentro de uma sessão.
//
//   npm run tarefa -- abrir <tipo>/<nome>   nasce a branch, marcada como ABERTA
//   npm run tarefa -- estado                em que pé está
//   npm run tarefa -- concluir              marca CONCLUÍDA (depois de integrada)
//
// A marca existe porque "a branch já está na main" não distingue tarefa
// CONCLUÍDA de RECÉM-ABERTA (zero commits). Marca AUSENTE = liberado.
import { git, gitQuieto, config } from "./_git.mjs";

const cwd = process.cwd();
const cfg = config(cwd);
const [acao, nome] = process.argv.slice(2);
const atual = git(cwd, "rev-parse", "--abbrev-ref", "HEAD");
const marca = (b) => gitQuieto(cwd, "config", `branch.${b}.${cfg.marca}`);

if (acao === "abrir") {
  if (!nome || !/^[a-z]+\/[a-z0-9._-]+$/.test(nome)) { console.error("uso: npm run tarefa -- abrir <tipo>/<nome>"); process.exit(64); }
  if (gitQuieto(cwd, "status", "--porcelain")) { console.error("Há trabalho não salvo. Commite ou guarde antes de abrir outra tarefa."); process.exit(1); }
  gitQuieto(cwd, "fetch", "origin", cfg.branchPrincipal, "--quiet");
  git(cwd, "checkout", "-b", nome, `origin/${cfg.branchPrincipal}`);
  git(cwd, "config", `branch.${nome}.${cfg.marca}`, "aberta");
  console.log(`Tarefa \`${nome}\` ABERTA a partir de origin/${cfg.branchPrincipal}.`);
} else if (acao === "concluir") {
  if (atual === cfg.branchPrincipal || atual === "HEAD") { console.error(`Você está em \`${atual}\`; concluir é sobre uma branch de tarefa.`); process.exit(1); }
  const fora = gitQuieto(cwd, "rev-list", "--count", `origin/${cfg.branchPrincipal}..${atual}`);
  if (fora && fora !== "0") { console.error(`\`${atual}\` ainda tem ${fora} commit(s) fora da ${cfg.branchPrincipal}. Integre antes (npm run integrar).`); process.exit(1); }
  git(cwd, "config", `branch.${atual}.${cfg.marca}`, "concluida");
  console.log(`Tarefa \`${atual}\` CONCLUÍDA. Próxima tarefa: npm run tarefa -- abrir <tipo>/<nome>`);
} else {
  const naMain = atual === cfg.branchPrincipal || atual === "HEAD";
  console.log(`branch:   ${atual}`);
  console.log(`tarefa:   ${marca(atual) || "(sem marca)"}`);
  console.log(`commits não integrados: ${naMain ? "0" : gitQuieto(cwd, "rev-list", "--count", `origin/${cfg.branchPrincipal}..${atual}`) || "?"}`);
  console.log(`arquivos não salvos:    ${gitQuieto(cwd, "status", "--porcelain").split("\n").filter(Boolean).length}`);
}
