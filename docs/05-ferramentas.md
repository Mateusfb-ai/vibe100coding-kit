# As ferramentas do ciclo, e onde cada uma entra

| Ferramenta | Tipo | Onde entra no ciclo | Instalar |
|---|---|---|---|
| **Superpowers** | plugin | Construir: `/brainstorming` → `/writing-plans` → `/subagent-driven-development`; `/dispatching-parallel-agents` para ondas; `/systematic-debugging` em bug; `/test-driven-development` | `/plugin install superpowers@claude-plugins-official` |
| **Ponytail** | plugin | Construir: a escada da preguiça em toda resposta (pula → reusa → stdlib → dependência → escreve), causa raiz em vez de sintoma, verificação mínima ao fim. Nível `lite / full / ultra`; "stop ponytail" desliga na sessão | `/plugin marketplace add DietrichGebert/ponytail` · `/plugin install ponytail@ponytail` |
| **Caveman** | plugin | Toda resposta: compacta a prosa, mantém código, commit e alerta de segurança normais | `/plugin install caveman@claude-plugins-official` |
| **code-review em painel** | plugin + prompt | Revisar, antes de integrar: revisores estreitos em paralelo (qualidade, segurança, tipagem, framework), cada achado com `arquivo:linha` + cenário de falha; síntese deduplica, filtra e ranqueia. Prompt em [`prompts/05-code-review-em-painel.md`](prompts/05-code-review-em-painel.md) | `/plugin install code-review@claude-plugins-official` · `/plugin install pr-review-toolkit@claude-plugins-official` (silent-failure-hunter, type-design-analyzer, comment-analyzer) |
| **agent-browser** (Vercel) | CLI | Provar: testa o frontend de verdade, por snapshot da árvore de acessibilidade (`@e1`, `@e2`…) em vez de seletor CSS ou pixel. `open` → `snapshot` → `click` / `fill` → `screenshot` | `npm i -g agent-browser && agent-browser install` |
| **find-skills** | skill | Qualquer fase: "existe skill para X?" busca e instala do ecossistema aberto (`skills.sh`) em vez de improvisar | `npx skills add vercel-labs/skills --skill find-skills` · depois `npx skills find "<tema>"` |
| **Graphify** | CLI | Antes de codar: `graphify query "<pergunta>"` responde arquitetura com `arquivo:linha`; `graphify update .` depois de mudar código | `pip install graphifyy` · `graphify .` |
| **Context7** | plugin/MCP | Antes de codar com biblioteca: doc da versão instalada, não a lembrança de treinamento | `/plugin install context7@context7-marketplace` |
| **Anthropic skills** | skills | Documentos (docx, xlsx, pptx, pdf), `skill-creator`, `mcp-builder` | `/plugin marketplace add anthropics/skills` · `/plugin install document-skills@anthropic-agent-skills` |
| **humanizer** | skill | Texto final para humano | `npx skills find humanizer` |

## Como o kit as chama sem você lembrar

- O hook `skill-suggest` lê o prompt e sugere a certa: bug → systematic-debugging · feature → brainstorming + spec · "revisa / code review / antes de mergear" → painel de revisão · "testa a tela / frontend" → agent-browser · "existe skill / como faço X" → find-skills · "resumido" → caveman.
- O hook `session-rules` lembra da escada da preguiça (Ponytail) e do grafo em toda sessão.
- A regra `roteamento-de-especialistas.md` diz qual agente do painel de revisão usar para cada classe de defeito.

## Custo sempre-ligado

Plugin instalado custa tokens em toda sessão (o painel de revisão e o `aia-harness` são os caros). `claude plugin disable <nome>` devolve o custo sem desinstalar. Instale o que o ciclo usa; o resto fica para `find-skills` achar na hora.
