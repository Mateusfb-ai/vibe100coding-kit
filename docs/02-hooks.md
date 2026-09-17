# Os quatro hooks

Todos em `.claude/hooks/*.cjs`, registrados em `.claude/settings.json`, sem rede e sem dependência (rodam a cada evento). Configuração opcional em `kit.json` na raiz do projeto.

| Evento | Hook | O que faz | Silêncio quando |
|---|---|---|---|
| `SessionStart` | `session-rules.cjs` | Injeta as regras da sessão + aviso de diretório compartilhado + aviso de árvore velha | avisos só aparecem quando valem |
| `UserPromptSubmit` | `skill-suggest.cjs` | Regex prompt → skill (processo antes de código); regras extras via `kit.json → skills` | nunca bloqueia |
| `PreToolUse` (Edit/Write) | `exige-tarefa.cjs` | Recusa edição na principal, com HEAD solto, com tarefa concluída ou com mutação de gate em voo | libera fora do repo e sem marca |
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
