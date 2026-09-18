#!/usr/bin/env node
// GATE: `sessao.mjs` abre a árvore inteira, e o hook de escopo recusa de verdade.
//
// Isto é teste de integração e não de unidade de propósito: as três coisas que
// já quebraram calado aqui só aparecem com git, disco e socket de verdade.
//
//   1. worktree ANINHADO — rodar o comando de dentro de uma árvore criava outra
//      dentro dela, e o caminho impresso saía errado.
//   2. porta REPETIDA — duas árvores recebiam a mesma porta e a segunda subia
//      onde ninguém procurava.
//   3. hook que LIBERA CALADO — `/tmp` e `/var` são symlink no macOS, e o
//      `--show-toplevel` do git responde o caminho REAL. Comparando os dois sem
//      resolver, todo arquivo caía em "fora do repositório" e o hook liberava.
//      Medido em 2026-09-18: 100% das recusas viraram liberação, sem uma linha
//      de aviso. É por isso que o laboratório nasce em `os.tmpdir()` — se
//      nascesse num caminho sem symlink, o gate passaria sem tocar no defeito.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { RAIZ, reprovar } from "./_arquivos.mjs";

const problemas = [];
const confere = (oque, condicao) => { if (!condicao) problemas.push(oque); };

const lab = mkdtempSync(path.join(tmpdir(), "gate-sessao-"));
const principal = path.join(lab, "principal");
const git = (cwd, ...a) => { try { return execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return ""; } };
const node = (cwd, ...a) => spawnSync(process.execPath, a, { cwd, encoding: "utf8" });

try {
  // ── o laboratório: um bare fazendo de origin e um checkout com o kit dentro ──
  execFileSync("git", ["init", "--bare", "-q", "origin.git"], { cwd: lab });
  mkdirSync(principal);
  for (const a of [["init", "-q", "."], ["config", "user.email", "gate@kit"], ["config", "user.name", "gate"], ["config", "commit.gpgsign", "false"]]) git(principal, ...a);
  for (const d of ["app/[locale]/painel", "app/api/painel", "lib", "content", "scripts", ".claude/hooks"]) mkdirSync(path.join(principal, d), { recursive: true });
  for (const f of ["_git.mjs", "sessao.mjs", "porta.mjs"]) cpSync(path.join(RAIZ, "scripts", f), path.join(principal, "scripts", f));
  for (const f of ["_kit.cjs", "escopo-da-sessao.cjs"]) cpSync(path.join(RAIZ, ".claude/hooks", f), path.join(principal, ".claude/hooks", f));
  writeFileSync(path.join(principal, "kit.json"), JSON.stringify({
    nome: "lab", branchPrincipal: "main", marca: "kitTarefa",
    escopos: {
      painel: ["app/[locale]/painel/", "app/api/painel/", "lib/painel.ts"],
      conteudo: ["content/"],
      site: ["app/", "components/"],
    },
  }, null, 2));
  writeFileSync(path.join(principal, "package.json"), '{"name":"lab","private":true}\n');
  writeFileSync(path.join(principal, ".env.local"), "SEGREDO=1\n");
  writeFileSync(path.join(principal, ".gitignore"), ".claude/worktrees/\n.env.local\n");
  for (const f of ["lib/community.ts", "lib/painel.ts", "app/page.tsx", "app/[locale]/painel/page.tsx", "content/post.md"]) writeFileSync(path.join(principal, f), "x\n");
  git(principal, "add", "-A"); git(principal, "commit", "-qm", "base"); git(principal, "branch", "-M", "main");
  git(principal, "remote", "add", "origin", path.join(lab, "origin.git")); git(principal, "push", "-q", "-u", "origin", "main");

  const sessao = (cwd, ...a) => node(cwd, path.join(principal, "scripts", "sessao.mjs"), ...a, "--sem-code", "--sem-install");

  // ── 1. a árvore nasce completa ──
  const r1 = sessao(principal, "feature/painel", "--painel");
  confere(`sessao saiu com ${r1.status}: ${(r1.stderr || "").trim()}`, r1.status === 0);
  const arvore = path.join(principal, ".claude/worktrees/painel");
  confere("worktree não nasceu em .claude/worktrees/painel", existsSync(arvore));
  confere("a branch não saiu de origin/main", git(principal, "rev-parse", "feature/painel") === git(principal, "rev-parse", "origin/main"));
  const env = path.join(arvore, ".env.local");
  confere(".env.local não é symlink", existsSync(env) && lstatSync(env).isSymbolicLink());
  confere(".env.local é symlink ABSOLUTO (quebra se o repo mudar de lugar)", existsSync(env) && !path.isAbsolute(readlinkSync(env)));
  confere("escopo não foi gravado na branch", git(principal, "config", "branch.feature/painel.escopo") === "painel");
  confere("a marca do kit não foi gravada", git(principal, "config", "branch.feature/painel.kitTarefa") === "aberta");
  confere("a árvore aninhada suja o git status do principal", git(principal, "status", "--porcelain") === "");

  // ── 2. a porta é reservada, e não repete ──
  const porta1 = git(principal, "config", "branch.feature/painel.porta");
  confere(`porta 1 fora da faixa: ${porta1 || "(nenhuma)"}`, /^30(0[1-9]|1\d|20)$/.test(porta1));
  sessao(principal, "feature/site", "--site");
  const porta2 = git(principal, "config", "branch.feature/site.porta");
  confere(`as duas árvores receberam a MESMA porta (${porta1})`, porta1 !== porta2);
  const rp = node(arvore, path.join(principal, "scripts", "porta.mjs"));
  confere(`porta.mjs devolveu "${rp.stdout.trim()}" e não ${porta1}`, rp.stdout.trim() === porta1);
  confere("porta.mjs inventou uma porta na branch principal", node(principal, path.join(principal, "scripts", "porta.mjs")).status !== 0);

  // ── 3. repetir não recria, e rodar de dentro não aninha ──
  const r3 = sessao(principal, "feature/painel", "--painel");
  confere("repetir o comando não saiu com 0", r3.status === 0);
  confere("repetir não avisou que a árvore já existe", /já existe/i.test(r3.stdout));
  sessao(arvore, "fix/de-dentro");
  confere("rodar de dentro de um worktree não criou a árvore na raiz", existsSync(path.join(principal, ".claude/worktrees/de-dentro")));
  confere("rodar de dentro criou uma árvore ANINHADA", !existsSync(path.join(arvore, ".claude/worktrees/de-dentro")));

  // ── 3b. reabrir a MESMA branch devolve a MESMA porta ──
  // A reserva da própria branch entrava no conjunto de "ocupadas": fechar e
  // reabrir a árvore gravava outra porta por cima, queimando uma por ciclo.
  git(principal, "worktree", "remove", "--force", arvore);
  sessao(principal, "feature/painel", "--painel");
  confere(`reabrir trocou a porta (era ${porta1}, virou ${git(principal, "config", "branch.feature/painel.porta")})`,
    git(principal, "config", "branch.feature/painel.porta") === porta1);

  // ── 3c. dois tipos com o mesmo nome não disputam a pasta calados ──
  // `feature/painel` e `fix/painel` querem `.claude/worktrees/painel`. A versão
  // antiga dizia "já existe", saía com 0, não criava a branch, e mandava a
  // sessão para uma árvore checada na OUTRA branch.
  const colisao = sessao(principal, "fix/painel", "--painel");
  confere("aceitou fix/painel na pasta de feature/painel", colisao.status !== 0);
  confere("criou a branch fix/painel mesmo assim", git(principal, "rev-parse", "--verify", "--quiet", "refs/heads/fix/painel") === "");

  // ── 4. nome e escopo inválidos são recusados ──
  for (const [oque, args] of [["tipo inválido", ["banana/x"]], ["nome sem barra", ["feature"]], ["escopo inexistente", ["feature/z", "--marte"]], ["dois escopos", ["feature/z", "--site", "--painel"]]]) {
    confere(`aceitou ${oque}`, sessao(principal, ...args).status !== 0);
  }

  // ── 5. o hook de escopo decide certo ──
  const hook = (cwd, arquivo) => spawnSync(process.execPath, [path.join(principal, ".claude/hooks/escopo-da-sessao.cjs")],
    { input: JSON.stringify({ tool_input: { file_path: path.join(cwd, arquivo) }, cwd }), encoding: "utf8" }).stdout || "";
  const arvoreSite = path.join(principal, ".claude/worktrees/site");
  const semEscopo = path.join(principal, ".claude/worktrees/de-dentro");
  const casos = [
    ["painel escreve em lib/painel.ts", arvore, "lib/painel.ts", "allow"],
    ["painel escreve na própria pasta", arvore, "app/[locale]/painel/page.tsx", "allow"],
    ["painel escreve em app/page.tsx (do site)", arvore, "app/page.tsx", "deny"],
    ["painel escreve em content/ (de conteudo)", arvore, "content/post.md", "deny"],
    ["painel escreve em lib/community.ts (comum)", arvore, "lib/community.ts", "allow"],
    ["painel cria arquivo NOVO no território do site", arvore, "app/novo.tsx", "deny"],
    ["site escreve em app/page.tsx", arvoreSite, "app/page.tsx", "allow"],
    ["site escreve na pasta do painel (prefixo mais longo)", arvoreSite, "app/[locale]/painel/page.tsx", "deny"],
    ["site escreve em lib/painel.ts", arvoreSite, "lib/painel.ts", "deny"],
    ["branch SEM escopo escreve onde quiser", semEscopo, "lib/painel.ts", "allow"],
    ["branch SEM escopo escreve em app/", semEscopo, "app/page.tsx", "allow"],
  ];
  for (const [oque, cwd, arquivo, esperado] of casos) {
    const saida = hook(cwd, arquivo);
    const veio = saida.includes('"deny"') ? "deny" : saida.includes('"allow"') ? "allow" : `nada (${saida.slice(0, 60)})`;
    confere(`${oque}: esperado ${esperado}, veio ${veio}`, veio === esperado);
  }
  confere("hook não liberou arquivo fora do repositório", hook(arvore, "../../../../../fora.txt").includes('"allow"'));

  // ── 6. NotebookEdit manda `notebook_path`, não `file_path` ──
  // O hook está registrado para a ferramenta; lendo só `file_path`, o alvo vinha
  // `undefined` e a guarda liberava. Estar no matcher não é cobrir.
  const hookNotebook = (cwd, arquivo) => spawnSync(process.execPath, [path.join(principal, ".claude/hooks/escopo-da-sessao.cjs")],
    { input: JSON.stringify({ tool_input: { notebook_path: path.join(cwd, arquivo) }, cwd }), encoding: "utf8" }).stdout || "";
  confere("NotebookEdit no território do site passou batido pelo escopo painel",
    hookNotebook(arvore, "app/analise.ipynb").includes('"deny"'));
  confere("NotebookEdit no próprio território foi recusado",
    hookNotebook(arvore, "app/api/painel/analise.ipynb").includes('"allow"'));
} finally {
  rmSync(lab, { recursive: true, force: true });
}

reprovar("sessao-abre-arvore", problemas);
