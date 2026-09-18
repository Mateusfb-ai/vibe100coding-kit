// Utilidades comuns aos quatro hooks. Sem rede, sem dependência: roda a cada
// evento e precisa custar menos que um piscar de olhos.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function lerEntrada() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return {}; }
}

function git(cwd, ...args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// kit.json é opcional: o kit funciona sem ele, com os padrões. Procura na raiz
// do repositório do cwd (não do hook), porque o mesmo hook serve vários
// projetos quando instalado globalmente.
function lerConfig(cwd) {
  const padrao = {
    nome: path.basename(git(cwd, 'rev-parse', '--show-toplevel') || cwd),
    branchPrincipal: 'main',
    marca: 'kitTarefa',
    comandos: {
      sessao: 'npm run sessao -- <tipo>/<tarefa>',
      tarefa: 'npm run tarefa -- abrir <tipo>/<nome>',
      gates: 'npm run gates',
      integrar: 'npm run integrar',
    },
    fontesDaVerdade: ['CLAUDE.md', 'docs/REGRA.md', 'docs/CEREBRO-AGENTE.md', 'learnings/'],
    regras: [],
    skills: [],
    pastasLimpas: ['src'],
  };
  const raiz = git(cwd, 'rev-parse', '--show-toplevel') || cwd;
  for (const candidato of [path.join(raiz, 'kit.json'), path.join(raiz, '.claude', 'kit.json')]) {
    try {
      const lido = JSON.parse(fs.readFileSync(candidato, 'utf8'));
      return { ...padrao, ...lido, comandos: { ...padrao.comandos, ...(lido.comandos || {}) } };
    } catch { /* próximo */ }
  }
  return padrao;
}

// Caminho real, com os symlinks resolvidos. `/tmp` e `/var` são symlink no
// macOS, e `git rev-parse --show-toplevel` sempre responde o caminho REAL. Sem
// resolver os dois lados, `abs.startsWith(raiz)` dá falso para todo arquivo sob
// um caminho ligado, o hook conclui "fora do repositório" e LIBERA — calado.
// Medido em 2026-09-18: o hook de escopo liberava 100% das recusas num
// repositório sob `/var/folders/...`.
//
// Resolve o DIRETÓRIO e recola o nome: `realpathSync` do arquivo estoura quando
// ele ainda não existe, que é exatamente o caso de todo `Write` novo.
function caminhoReal(p) {
  // String vazia entra quando o `git` falhou. Sem esta linha ela viraria o cwd
  // (`dirname('')` é `.`), e quem chama leria isso como "achei a raiz".
  if (!p) return p;
  const dir = path.dirname(p);
  try { return path.join(fs.realpathSync(dir), path.basename(p)); } catch { return p; }
}

module.exports = { lerEntrada, git, lerConfig, caminhoReal };
