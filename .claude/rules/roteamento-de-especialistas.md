# Roteamento de especialistas


## Antes de despachar qualquer coisa

Multiagente custa **3 a 10× mais tokens** que um agente só resolvendo a mesma
tarefa (medição da própria Anthropic, *Multi-Agent Systems: When to Use Them*,
jan/2026). Esse custo só se paga em três casos:

- **proteção de contexto** — a investigação geraria ruído demais na sessão
  principal;
- **paralelização real** — o trabalho é genuinamente independente;
- **especialização genuína** — a tarefa exige um checklist que um generalista
  não carrega.

Fora deles, é despesa sem retorno. E decomponha por **fronteira de contexto
isolável** (o que cada tarefa precisa saber para trabalhar sozinha), nunca por
tema ("um agente pro banco, um pro front") nem por fase ("um pra planejar, um
pra testar").

⚠️ Se o `CLAUDE.md` do projeto diz "não despache agente sem o dono pedir", esta
tabela responde *"qual especialista, quando eu for despachar"*, e não autoriza
despachar por conta própria.

## Tabela

| Agente | Quando usar | Camada de modelo |
|---|---|---|
| `Explore` | Varredura ampla e somente leitura: "onde está X", "quais arquivos usam Y" em muitas pastas ao mesmo tempo. Devolve conclusão, não despejo de arquivo. | rápida |
| `caveman:cavecrew-investigator` | Localizar código com saída comprimida — tabela `arquivo:linha`. Recusa sugerir conserto, de propósito. | rápida |
| `feature-dev:code-explorer` | Entender uma feature que já existe: traçar o caminho de execução, mapear camadas e dependências antes de mexer. | intermediária |
| `Plan` / `feature-dev:code-architect` | Desenhar a implementação a partir dos padrões que a base já usa, antes de escrever código. | forte |
| `coder` / `backend-dev` | Implementação de rota, lógica de servidor, persistência. | intermediária |
| `typescript-specialist` | Tipagem, correção de assíncrono, escape do sistema de tipos. | intermediária |
| `database-specialist` | Schema, migração, índice, estratégia de consulta. ⚠️ Migração destrutiva vai DEPOIS do deploy. | intermediária |
| `tester` | Testes de unidade e integração, TDD, caso de borda. | intermediária |
| `feature-dev:code-reviewer` | Revisão geral de mudança — bug, erro de lógica, convenção do projeto. | intermediária |
| `pr-review-toolkit:silent-failure-hunter` | `catch` que engole a causa, fallback que esconde o defeito. | intermediária |
| `pr-review-toolkit:type-design-analyzer` | Tipo largo demais escondendo estado impossível. | intermediária |
| `pr-review-toolkit:comment-analyzer` | Comentário que descreve o quê em vez do porquê (o kit proíbe comentário nas pastas limpas). | rápida |
| `code-simplifier:code-simplifier` | Enxugar código recém-escrito sem mudar comportamento. | intermediária |
| `analyst` / `reviewer` | Revisão de qualidade mais ampla, com recomendação de melhoria. | intermediária |
| `researcher` | Pesquisa externa: documentação, comparação de fornecedor, estado da arte. | intermediária |
| `general-purpose` | Não bate com nenhuma linha acima. Se cair aqui com frequência, falta uma linha na tabela. | intermediária |

## Camada de modelo — sempre explícita

**Nunca deixe o despacho herdar o modelo da sessão principal em silêncio.** Use
a camada mais barata que ainda resolve:

- **rápida** (Haiku) — mecânico: busca, edição de um arquivo com a mudança já
  100% especificada.
- **intermediária** (Sonnet) — o padrão de implementação, debug e revisão.
- **forte** (Opus) — decisão arquitetural difícil, não volume de trabalho.

## Regra de manutenção

Se dois agentes desta tabela cobrem o mesmo gatilho, um está sobrando. E
**nome de agente é fato verificável, não lembrança**: antes de acrescentar uma
linha, confirme que o agente existe na listagem de tipos da sessão — nome
de tela de produto de terceiro segue a mesma regra.

## Agentes do projeto

Além dos genéricos, cada projeto pode ter agentes direcionais em `.claude/agents/`
(um por domínio: banco, auth, deploy, observabilidade…). Diferença: eles carregam
as verdades MEDIDAS do projeto, a seção do `CLAUDE.md` que decide, as skills
certas e as armadilhas que já custaram caro. Vão no clone, então não dependem
do ambiente de quem abre a sessão. Regra: agente novo ganha uma linha nesta
tabela, ou é um agente que ninguém despacha.
