# Decisões de desenho: o que foi adotado, o que foi construído, o que ficou de fora

Sete pilares sustentam o kit: orquestrar em vez de implementar sozinho · brainstorm → plano → implementação → revisão · economia de token · Ponytail + Caveman · gate que prova · grafo do código · memória em duas camadas.

## Adotado do ecossistema
| Peça | Como entra aqui |
|---|---|
| Superpowers (brainstorming, systematic-debugging, TDD, subagent-driven-development) | plugin, sugerido pelo hook `skill-suggest` a cada prompt |
| Ponytail / Caveman | plugins: escada da preguiça em todo código e prosa compacta; o hook lembra da escada em toda sessão e sugere `caveman` quando o pedido é por brevidade |
| agent-browser (Vercel) | CLI para provar o frontend por árvore de acessibilidade; entra na fase Provar e no pedido completo |
| code-review em painel | plugin `code-review` + `pr-review-toolkit` e o prompt de painel; entra entre Provar e Publicar |
| impeccable | design de interface com método: shape → build → critique/audit → polish; entra em toda tela |
| find-skills | antes de improvisar, `npx skills find`; o hook sugere quando o pedido é "existe skill / como faço" |
| Graphify | `graphify query` é a regra 1 de toda sessão; `vibekit doctor` acusa a ausência do grafo |
| context7 | regra de epistemologia: fato de biblioteca se lê na doc da versão instalada |
| Memória em duas camadas | `MEMORY.md` + notas por tópico, e `learnings/` como lei do aprendizado |
| Subagent-driven development (Superpowers) | `.claude/rules/ondas-paralelas.md`, com a regra de formação de onda por arquivos disjuntos |

## Construído por cima
| Prática comum | Aqui | Por quê |
|---|---|---|
| Tabela genérica de especialistas (`backend-specialist`, `database-architect`…) | `roteamento-de-especialistas.md` com os agentes que **existem** na sessão, camada de modelo explícita | despachar um nome inexistente falha em silêncio |
| Hooks como boas práticas em prosa | 4 hooks executáveis que impõem o ciclo (recusa na main, tarefa concluída, mutação em voo, lembrete de integrar) | regra escrita depende de alguém lembrar; hook recusa |
| Gate de lint subindo de `warn` para `error` | **meta-gate**: cada gate prova que pega o defeito real, com mutação declarada, cobertura por contagem e âncora viva | doze gates nasceram cegos, dez pela mesma causa |
| `CLAUDE.md.template` genérico | template com as quatro leis, tabela "erro → regra que previne", régua checável, escalada, lei do aprendizado; separado do `CEREBRO-AGENTE.md` (como pensar) | o CLAUDE.md diz o que fazer; o cérebro diz como raciocinar |
| Ondas paralelas de implementadores | + `onda-de-investigacao.md`: leitura em paralelo, escrita serial, para o caso comum de várias tarefas no MESMO arquivo | colisão é da escrita, não da leitura |
| Sem ciclo de integração | `sessao → tarefa → integrar` com worktree por sessão, marca explícita de tarefa, fila FIFO por máquina, rebase antes de validar | um rebase de 65 commits apagou três peças aprovadas passando em todos os gates |
| Instalação manual, arquivo por arquivo | `npx vibe100coding-kit init` aditivo (nunca sobrescreve) + `doctor` | ferramenta que gera harness por cima de um `.claude/` afinado é ferramenta de projeto novo |

## Lido e deixado de fora, com o motivo
| Peça | Por quê |
|---|---|
| Proxy de tokens (RTK) | depende de um binário que não é publicado. Sem ele, o hook falha aberto e é peso morto. |
| Obsidian como memória | não inventar um cofre quando já existe destino de longo prazo (`learnings/` + memória do agente). Um segundo sistema de memória diverge em silêncio. |
| ESLint/Biome com regra nascendo em `warn` | a filosofia "regra nova nasce sem travar" está atendida pelo meta-gate + `gates-removidos.txt`; lint é decisão por projeto. |
