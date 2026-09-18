#!/usr/bin/env node
// PreToolUse (Edit|Write|NotebookEdit) — não se edita sem uma tarefa aberta.
//
// O que isto impede, e por que é hook e não regra escrita: editar direto na
// branch principal, e uma tarefa nova nascer por cima da anterior sem ninguém
// notar. As duas coisas aconteceram em produção, nenhuma deu erro, e as duas só
// apareceram depois (uma branch publicada VAZIA, 33 trocas de branch no
// diretório compartilhado). Regra escrita depende de alguém lembrar; isto recusa.
//
// BLOQUEIA em exatamente três estados:
//   · a branch é a principal
//   · HEAD solto (detached)
//   · a marca da branch é `concluida` (a tarefa anterior já foi integrada)
// LIBERA no resto, inclusive sem marca nenhuma: branch criada antes do kit, ou
// à mão, não pode ficar refém de um mecanismo que ela não conhece. Gate novo
// que trava trabalho em andamento é gate que alguém desliga no mesmo dia.
//
// NÃO INFERE PELO GIT. "A branch já está na main" é verdade tanto para a tarefa
// CONCLUÍDA quanto para a RECÉM-ABERTA (zero commits, por construção). A marca
// é explícita: git config branch.<nome>.<marca> = aberta | concluida, escrita
// por scripts/tarefa.mjs.
//
// Quem manda é o diretório do ARQUIVO, não o cwd da sessão: o cwd costuma ser o
// checkout principal enquanto o trabalho acontece num worktree, por caminho
// absoluto. Fora do repositório (scratchpad, /tmp) não é trabalho do produto.
const path = require('node:path');
const fs = require('node:fs');
const { lerEntrada, git, lerConfig, caminhoReal } = require('./_kit.cjs');

const entrada = lerEntrada();
const alvo = entrada.tool_input && entrada.tool_input.file_path;
const base = alvo ? path.dirname(path.resolve(alvo)) : (entrada.cwd || process.cwd());
const cwd = fs.existsSync(base) ? base : (entrada.cwd || process.cwd());
const cfg = lerConfig(cwd);

function liberar() {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } }));
  process.exit(0);
}
function recusar(motivo) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo } }));
  process.exit(0);
}

const raiz = caminhoReal(git(cwd, 'rev-parse', '--show-toplevel'));
if (!raiz) liberar();
if (alvo) {
  const abs = caminhoReal(path.resolve(cwd, alvo));
  if (abs !== raiz && !abs.startsWith(raiz + path.sep)) liberar();
}

// Mutação de gate em voo: o meta-gate injeta o defeito no arquivo, roda o gate
// e restaura por cima. Editar nessa janela faz a edição sumir sem rastro.
try {
  const marca = JSON.parse(fs.readFileSync(path.join(raiz, '.kit-mutacao-em-voo.json'), 'utf8'));
  let vivo = false;
  try { process.kill(marca.pid, 0); vivo = true; } catch { vivo = false; }
  if (vivo) recusar(`Há mutação de gate em voo nesta árvore (pid ${marca.pid}, desde ${marca.desde}). O meta-gate tem um defeito injetado no disco AGORA e vai restaurar o arquivo por cima. Espere ele terminar.`);
} catch { /* sem marca: segue */ }

const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD');
if (!branch) liberar();

const como = [
  '',
  'Abra a tarefa antes de editar:',
  '',
  `  ${cfg.comandos.tarefa}`,
  '',
  '  tipo: feature | fix | chore | docs | refactor | perf | style',
  '  exemplo: npm run tarefa -- abrir fix/botao-salvar',
  '',
  'Uma tarefa por branch. Escolha o nome pelo que o dono pediu.',
].join('\n');

if (branch === cfg.branchPrincipal) recusar(`Você está na \`${cfg.branchPrincipal}\`, e nada é editado direto nela.${como}`);
if (branch === 'HEAD') recusar(`HEAD solto (detached): um commit aqui não pertence a branch nenhuma.${como}`);

const marca = git(cwd, 'config', `branch.${branch}.${cfg.marca}`);
if (marca === 'concluida') {
  recusar(`A tarefa da branch \`${branch}\` já foi CONCLUÍDA e integrada. Editar aqui empilharia trabalho novo sobre uma tarefa encerrada.${como}`);
}

liberar();
