# Os cinco hooks

Todos em `.claude/hooks/*.cjs`, registrados em `.claude/settings.json`, sem rede e sem dependência (rodam a cada evento). Configuração opcional em `kit.json` na raiz do projeto.

| Evento | Hook | O que faz | Silêncio quando |
|---|---|---|---|
| `SessionStart` | `session-rules.cjs` | Injeta as regras da sessão + aviso de diretório compartilhado + aviso de árvore velha | avisos só aparecem quando valem |
| `UserPromptSubmit` | `skill-suggest.cjs` | Regex prompt → skill (processo antes de código); regras extras via `kit.json → skills` | nunca bloqueia |
| `PreToolUse` (Edit/Write) | `exige-tarefa.cjs` | Recusa edição na principal, com HEAD solto, com tarefa concluída ou com mutação de gate em voo | libera fora do repo e sem marca |
| `PreToolUse` (Edit/Write) | `escopo-da-sessao.cjs` | Recusa escrever no território de OUTRO escopo, pelo mapa de `kit.json → escopos` | libera sem marca de escopo, e no que ninguém reivindica |
| `Stop` | `fim-de-tarefa.cjs` | Lembra de integrar quando há commits prontos e parados | tarefa não aberta, árvore suja, zero commits |

## kit.json

```json
{
  "nome": "MeuProjeto",
  "branchPrincipal": "main",
  "fontesDaVerdade": ["CLAUDE.md", "docs/REGRA.md", "docs/CEREBRO-AGENTE.md", "learnings/"],
  "regras": ["O QUE É: ...", "SEGURANÇA: ..."],
  "skills": [{ "regex": "\\bdeploy\\b", "msg": "Rode os gates antes." }],
  "pastasLimpas": ["src"],
  "comandos": { "sessao": "npm run sessao -- <tipo>/<tarefa>" }
}
```

## Boas práticas que estes hooks seguem
- Saída JSON no formato do Claude Code (`hookSpecificOutput`), nunca texto solto no `stdout` de um hook que decide.
- `Stop` nunca devolve `decision: "block"` (laço infinito).
- Quem manda é o diretório do arquivo editado, não o cwd da sessão (worktrees).
- Hook que quebra por causa da própria peça nova é pior que hook ausente: todo `try` libera em caso de erro.
- Testar na mão: `echo '{"prompt":"tem um bug"}' | node .claude/hooks/skill-suggest.cjs`.

## `escopo-da-sessao.cjs`

**Território exclusivo, não lista de permissão.** O escopo `site` não é "só pode `app/` e `components/`"; é "não pode o território DOS OUTROS". O que ninguém reivindica em `kit.json → escopos` (`lib/`, `tests/`, `docs/`, `package.json`) fica livre para todo mundo — é onde a colisão é rara e o bloqueio irritaria. Guarda que barra demais é guarda que alguém desliga no mesmo dia.

**Prefixo mais longo vence.** `app/[locale]/painel/page.tsx` casa com o `app/` do escopo `site` **e** com o `app/[locale]/painel/` do escopo `painel`. Sem essa regra o painel nunca teria território próprio, porque o site engole tudo.

**Sem marca, libera.** Branch criada antes do kit, ou à mão, não fica refém de um mecanismo que ela não conhece — mesma regra do `exige-tarefa`.

```json
"escopos": {
  "painel":   ["app/[locale]/painel/", "app/api/painel/", "lib/painel.ts"],
  "conteudo": ["content/", "messages/", "social/"],
  "site":     ["app/", "components/"]
}
```

### O defeito que este hook já teve, e o gate que o pega

`/tmp` e `/var` são symlink no macOS, e `git rev-parse --show-toplevel` sempre responde o caminho **real**. Comparando `path.resolve(arquivo)` com ele sem resolver os dois lados, todo arquivo sob um caminho ligado caía em "fora do repositório" — e o hook **liberava, calado**. Medido em 2026-09-18: 100% das recusas viraram liberação, sem uma linha de aviso. O mesmo defeito estava no `exige-tarefa.cjs`, desde sempre.

`caminhoReal()` em `_kit.cjs` resolve os dois lados. Ele resolve o **diretório** e recola o nome, porque `realpathSync` do arquivo estoura quando ele ainda não existe — que é o caso de todo `Write` novo.

O gate `sessao-abre-arvore` monta o laboratório em `os.tmpdir()` **de propósito**: num caminho sem symlink ele passaria sem tocar no defeito.
