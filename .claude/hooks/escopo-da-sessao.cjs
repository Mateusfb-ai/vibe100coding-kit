#!/usr/bin/env node
// PreToolUse (Edit|Write|NotebookEdit) — cada sessão escreve no seu território.
//
// O QUE ISTO IMPEDE: duas sessões abertas ao mesmo tempo editarem o MESMO
// arquivo em branches diferentes. Não dá erro, não dá conflito na hora: dá um
// rebase sangrento dias depois, quando ninguém lembra mais o que cada uma
// queria ali.
//
// TERRITÓRIO EXCLUSIVO, NÃO LISTA DE PERMISSÃO. O escopo `site` não é "só pode
// app/ e components/"; é "não pode o território DOS OUTROS". O que ninguém
// reivindica em `kit.json` (`lib/`, `tests/`, `docs/`, `package.json`) fica
// livre para todo mundo — é onde a colisão é rara e o bloqueio irritaria. Guarda
// que barra demais é guarda que alguém desliga no mesmo dia.
//
// PREFIXO MAIS LONGO VENCE. `app/[locale]/painel/page.tsx` casa com o `app/` do
// escopo `site` E com o `app/[locale]/painel/` do escopo `painel`. Sem essa
// regra o painel nunca teria território próprio, porque o site engole tudo.
//
// SEM MARCA, LIBERA. Branch criada antes do kit, ou à mão, não pode ficar refém
// de um mecanismo que ela não conhece — mesma regra do `exige-tarefa`.
//
// Quem manda é o diretório do ARQUIVO, não o cwd da sessão: o cwd costuma ser o
// checkout principal enquanto o trabalho acontece num worktree, por caminho
// absoluto.
const path = require('node:path');
const fs = require('node:fs');
const { lerEntrada, git, lerConfig, caminhoReal } = require('./_kit.cjs');

const entrada = lerEntrada();
const alvo = entrada.tool_input && entrada.tool_input.file_path;

function liberar() {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } }));
  process.exit(0);
}
function recusar(motivo) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo } }));
  process.exit(0);
}

if (!alvo) liberar();

const abs = caminhoReal(path.resolve(alvo));
const base = fs.existsSync(path.dirname(abs)) ? path.dirname(abs) : (entrada.cwd || process.cwd());
const raiz = caminhoReal(git(base, 'rev-parse', '--show-toplevel'));
if (!raiz) liberar();
if (abs !== raiz && !abs.startsWith(raiz + path.sep)) liberar();

const branch = git(base, 'rev-parse', '--abbrev-ref', 'HEAD');
if (!branch || branch === 'HEAD') liberar();

const escopo = git(base, 'config', `branch.${branch}.escopo`);
if (!escopo) liberar();

const cfg = lerConfig(base);
const escopos = cfg.escopos && typeof cfg.escopos === 'object' ? cfg.escopos : {};
if (!escopos[escopo]) liberar();

const rel = path.relative(raiz, abs).split(path.sep).join('/');

// Casa o arquivo exato (`lib/painel.ts`) ou qualquer coisa sob a pasta
// (`app/api/painel/` pega `app/api/painel/publicar/route.ts`).
function casa(rel, prefixo) {
  const p = prefixo.replace(/\/+$/, '');
  return rel === p || rel.startsWith(p + '/');
}

let dono = null;
let maisLongo = -1;
for (const [nome, prefixos] of Object.entries(escopos)) {
  if (!Array.isArray(prefixos)) continue;
  for (const prefixo of prefixos) {
    if (!casa(rel, prefixo)) continue;
    const peso = prefixo.replace(/\/+$/, '').length;
    if (peso > maisLongo) { maisLongo = peso; dono = nome; }
  }
}

if (!dono || dono === escopo) liberar();

recusar([
  `\`${rel}\` é território do escopo \`${dono}\`, e esta sessão abriu como \`${escopo}\`.`,
  '',
  `Território de \`${dono}\`: ${escopos[dono].join('  ')}`,
  '',
  'Duas sessões editando o mesmo arquivo em branches diferentes não dá erro na hora —',
  'dá rebase sangrento dias depois. Então: ou este arquivo não é desta tarefa, ou a',
  'tarefa foi aberta com o escopo errado.',
  '',
  'Para trabalhar nele, abra a sessão certa:',
  '',
  `  npm run sessao -- <tipo>/<nome> --${dono}`,
  '',
  `Ou, se o escopo desta branch estiver errado mesmo:  git config branch.${branch}.escopo ${dono}`,
].join('\n'));
