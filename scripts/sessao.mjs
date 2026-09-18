#!/usr/bin/env node
// Abre uma árvore de trabalho pronta para esta sessão, com UM comando.
//
//   npm run sessao -- <tipo>/<tarefa> [--<escopo>] [--sem-code] [--sem-install]
//   npm run sessao -- feature/painel --painel
//
// POR QUE ISTO EXISTE: várias sessões trabalham no mesmo repositório ao mesmo
// tempo e, no MESMO diretório, o `HEAD` do git é um arquivo só. Quem der
// `checkout` troca o branch de todo mundo que estiver ali, sem avisar ninguém.
// O worktree resolve porque dá um `HEAD` por diretório, mantendo UMA
// configuração, UM conjunto de remotes e os MESMOS ganchos.
//
// E por que ele faz mais que criar o worktree: abrir a árvore à mão custava
// cinco passos, e cada passo esquecido falha CALADO -- branch saída de uma
// `main` velha, `.env` ausente deixando toda credencial vazia, `node_modules`
// faltando reprovando gates que não têm defeito nenhum, duas árvores brigando
// pela mesma porta. Falha por pré-condição é indistinguível de defeito, e regra
// que depende de alguém lembrar é regra que já falhou.
import { existsSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { git, gitQuieto, raizDoRepo, config } from "./_git.mjs";

const PORTA_INICIAL = 3001; // 3000 é do checkout principal, e é a que se digita sem pensar.
const PORTA_FINAL = 3020;
const TIPOS = "feature|fix|chore|docs|refactor|perf|style";

const raiz = raizDoRepo();
const cfg = config(raiz);
const escopos = cfg.escopos && typeof cfg.escopos === "object" ? cfg.escopos : {};

const argumentos = process.argv.slice(2);
const semCode = argumentos.includes("--sem-code");
const semInstall = argumentos.includes("--sem-install");
const tarefa = argumentos.find((a) => !a.startsWith("--"));

const flags = argumentos.filter((a) => a.startsWith("--") && a !== "--sem-code" && a !== "--sem-install");
const escopo = flags.length ? flags[0].replace(/^--/, "") : null;

function uso(erro) {
  console.error(erro);
  console.error("");
  console.error("uso: npm run sessao -- <tipo>/<tarefa> [--<escopo>] [--sem-code] [--sem-install]");
  console.error(`     tipo: ${TIPOS.split("|").join(" | ")}`);
  if (Object.keys(escopos).length) {
    console.error(`     escopo: ${Object.keys(escopos).join(" | ")}   (declara o território desta sessão)`);
  }
  console.error(`     exemplo: npm run sessao -- fix/botao-salvar${Object.keys(escopos)[0] ? ` --${Object.keys(escopos)[0]}` : ""}`);
  process.exit(64);
}

if (!tarefa || !new RegExp(`^(${TIPOS})/[a-z0-9._-]+$`).test(tarefa)) {
  uso(tarefa ? `Nome inválido: \`${tarefa}\`` : "Falta o nome da tarefa.");
}
if (flags.length > 1) uso(`Escopo é um só. Vieram ${flags.length}: ${flags.join(" ")}`);
if (escopo && !escopos[escopo]) {
  uso(Object.keys(escopos).length
    ? `Escopo desconhecido: \`--${escopo}\`.`
    : `Este projeto não declara escopos em kit.json, então \`--${escopo}\` não significa nada.`);
}

const nome = tarefa.split("/")[1];
const destino = path.join(raiz, ".claude", "worktrees", nome);

// Repetir o comando é o jeito natural de perguntar "onde ficou mesmo?". Sair
// com erro puniria a pergunta, então isto responde e sai bem.
if (existsSync(destino)) {
  const portaAntiga = gitQuieto(raiz, "config", `branch.${tarefa}.porta`);
  console.log("Esta árvore já existe.");
  console.log(`\n  cd "${destino}"${portaAntiga ? `   (porta ${portaAntiga})` : ""}\n`);
  process.exit(0);
}

// --- 1. a branch nasce da principal ATUALIZADA -------------------------------
// Nunca do que estiver no disco: partir da branch de outra sessão é herdar
// trabalho que não é seu e não saber disso.
process.stdout.write(`[sessao] git fetch origin ${cfg.branchPrincipal}… `);
gitQuieto(raiz, "fetch", "origin", cfg.branchPrincipal, "--quiet");
console.log("ok");

const existe = gitQuieto(raiz, "rev-parse", "--verify", "--quiet", `refs/heads/${tarefa}`) !== "";
try {
  git(raiz, ...(existe
    ? ["worktree", "add", destino, tarefa]
    : ["worktree", "add", "-b", tarefa, destino, `origin/${cfg.branchPrincipal}`]));
} catch (e) {
  console.error(`\n[sessao] o git recusou criar a árvore:\n${e.stderr || e.message}`);
  process.exit(1);
}
console.log(`[sessao] worktree em .claude/worktrees/${nome} (branch \`${tarefa}\`${existe ? ", já existia" : `, saída de origin/${cfg.branchPrincipal}`})`);

// --- 2. a porta, reservada uma vez e guardada na branch ----------------------
// Os dois testes são necessários e nenhum basta sozinho: só o git config não vê
// o servidor de OUTRO projeto na 3001; só o teste de socket entrega a mesma
// porta a duas árvores que ainda não subiram.
const reservadas = new Set(
  gitQuieto(raiz, "config", "--get-regexp", "^branch\\..*\\.porta$")
    .split("\n").map((l) => l.trim().split(/\s+/)[1]).filter(Boolean),
);
const livre = (porta) => new Promise((responder) => {
  const servidor = net.createServer();
  servidor.once("error", () => responder(false));
  servidor.once("listening", () => servidor.close(() => responder(true)));
  servidor.listen(porta, "127.0.0.1");
});

let porta = null;
for (let p = PORTA_INICIAL; p <= PORTA_FINAL; p++) {
  if (reservadas.has(String(p))) continue;
  if (await livre(p)) { porta = p; break; }
}
if (porta) {
  git(raiz, "config", `branch.${tarefa}.porta`, String(porta));
  console.log(`[sessao] porta ${porta} reservada para esta branch`);
} else {
  // Não inventa uma porta: a árvore fica pronta sem reserva e o `dev` cai no
  // padrão. Avisar é melhor que entregar um número que já vai colidir.
  console.log(`[sessao] AVISO: ${PORTA_INICIAL}-${PORTA_FINAL} todas tomadas — sem porta reservada.`);
}

// --- 3. as marcas da branch --------------------------------------------------
// O escopo é marca EXPLÍCITA, nunca inferido do que a sessão editou: inferir só
// responde depois de a edição existir, e aí o estrago já aconteceu.
git(raiz, "config", `branch.${tarefa}.${cfg.marca}`, "aberta");
if (escopo) {
  git(raiz, "config", `branch.${tarefa}.escopo`, escopo);
  console.log(`[sessao] escopo \`${escopo}\`: ${escopos[escopo].join("  ")}`);
}

// --- 4. o ambiente, por symlink RELATIVO -------------------------------------
// Symlink e não cópia: credencial girada no checkout principal precisa chegar a
// todas as árvores de uma vez, e cópia congela o valor do dia em que a árvore
// foi aberta. Relativo para o link não quebrar se o repo inteiro for movido.
const ambientes = Array.isArray(cfg.arquivosDoAmbiente) ? cfg.arquivosDoAmbiente : [".env.local", ".env"];
const ligados = [];
for (const arquivo of ambientes) {
  const naRaiz = path.join(raiz, arquivo);
  const aqui = path.join(destino, arquivo);
  if (!existsSync(naRaiz) || existsSync(aqui)) continue;
  symlinkSync(path.relative(destino, naRaiz), aqui);
  ligados.push(arquivo);
}
if (ligados.length) console.log(`[sessao] ${ligados.join(", ")} -> symlink para o checkout principal`);
else if (ambientes.some((a) => existsSync(path.join(raiz, a)))) console.log("[sessao] ambiente já estava ligado");
else console.log(`[sessao] AVISO: nenhum de ${ambientes.join(", ")} existe no checkout principal — a árvore nasce sem credencial.`);

// --- 5. as dependências ------------------------------------------------------
// Falha aqui NÃO derruba o comando: a árvore já existe e é útil. Travar a
// abertura da sessão por uma dependência offline seria pior que a pré-condição
// original -- e sem `node_modules` os gates reprovam sem defeito nenhum.
let instalou = true;
if (!semInstall && existsSync(path.join(destino, "package.json"))) {
  console.log("[sessao] npm install…");
  const r = spawnSync("npm", ["install"], { cwd: destino, stdio: "inherit" });
  instalou = r.status === 0;
  if (!instalou) console.log(`[sessao] npm install FALHOU — rode à mão: cd "${destino}" && npm install`);
}

// --- 6. a janela -------------------------------------------------------------
const temCode = spawnSync("command", ["-v", "code"], { shell: true, stdio: "ignore" }).status === 0;
let abriu = false;
if (!semCode && temCode) {
  abriu = spawnSync("code", [destino], { stdio: "ignore" }).status === 0;
}

console.log("");
console.log(`Pronto.${abriu ? " Abrindo o VS Code nesta árvore." : ""}`);
console.log("");
console.log(`  cd "${destino}"`);
if (!abriu) console.log("  code .");
if (porta) console.log(`  npm run dev            -> http://localhost:${porta}`);
if (!instalou) console.log("  npm install            <- ainda falta");
console.log("");
console.log(`Trabalhe SÓ aqui. Ao terminar: ${cfg.comandos?.gates || "npm run gates"} -> commit -> push -> pergunte ao dono -> ${cfg.comandos?.integrar || "npm run integrar"}.`);
