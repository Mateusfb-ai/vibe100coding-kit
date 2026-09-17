#!/usr/bin/env node
// Stop — lembra de fechar o ciclo quando há trabalho pronto e parado.
//
// O defeito mais caro e mais silencioso de um repositório com várias sessões:
// trabalho commitado, publicado na branch, e NUNCA integrado. Nove commits
// ficaram assim por dias e ninguém percebeu, porque nada falha: o site
// simplesmente continua servindo a versão anterior.
//
// Fala só quando há o que dizer: tarefa marcada como aberta, commits fora da
// principal e árvore limpa. Em turno de conversa ou com trabalho pela metade,
// é mudo. Nunca `decision: "block"`: bloquear a parada faria o agente
// continuar, o hook disparar de novo, e assim por diante.
const { lerEntrada, git, lerConfig } = require('./_kit.cjs');

const entrada = lerEntrada();
const cwd = entrada.cwd || process.cwd();
const cfg = lerConfig(cwd);

function calado() {
  process.stdout.write(JSON.stringify({ suppressOutput: true }));
  process.exit(0);
}

const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD');
if (!branch || branch === cfg.branchPrincipal || branch === 'HEAD') calado();
if (git(cwd, 'config', `branch.${branch}.${cfg.marca}`) !== 'aberta') calado();
if (git(cwd, 'status', '--porcelain')) calado();

const commits = git(cwd, 'rev-list', '--count', `origin/${cfg.branchPrincipal}..${branch}`);
if (!commits || commits === '0') calado();

const lista = git(cwd, 'log', '--oneline', `origin/${cfg.branchPrincipal}..${branch}`);

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'Stop',
    additionalContext: [
      '',
      `TAREFA \`${branch}\` COM ${commits} COMMIT(S) PRONTO(S) E NÃO INTEGRADO(S):`,
      lista.split('\n').map((l) => `  ${l}`).join('\n'),
      '',
      'Se a tarefa terminou, feche o ciclo com o dono, nesta ordem:',
      '  1. diga o que mudou e o que ficou em aberto (relatório curto em markdown);',
      '  2. PERGUNTE se ele quer integrar (é decisão dele, nunca sua);',
      `  3. autorizado: ${cfg.comandos.integrar}`,
      '  4. depois de integrada: npm run tarefa -- concluir',
      '',
      'Enquanto não integrar, o trabalho NÃO está no ar. Branch publicada não é deploy feito.',
      '',
    ].join('\n'),
  },
}));
