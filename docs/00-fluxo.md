# O fluxo completo, etapa por etapa (e o defeito que originou cada uma)

```
abrir sessão ─► sessao/tarefa ─► brainstorm → spec ─► implementar (TDD) ─► gates ─► commit ─► push
                                                                                          │
   registrar (learnings/) ◄─ tarefa concluir ◄─ integrar (rebase → gates → push) ◄─ dono autoriza
```

## Abrir a sessão
O hook `session-rules` injeta as regras não negociáveis e dois avisos condicionais: diretório compartilhado com outros checkouts, e árvore atrás da principal. **Defeito de origem:** uma sessão inventariou órfãos numa árvore 85 commits atrás e entregou um plano para uma tarefa já concluída.

## `npm run sessao -- <tipo>/<tarefa>`
Cria um worktree a partir de `origin/<principal>` e marca a branch como ABERTA. **Defeito de origem:** duas sessões no mesmo diretório trocaram de branch uma embaixo da outra; um commit foi parar na branch alheia e uma branch vazia foi publicada (33 trocas de branch medidas no diretório principal).

## `npm run tarefa -- abrir`
O mesmo sem worktree, para quem trabalha sozinho. A marca `branch.<nome>.kitTarefa` é o que o hook `exige-tarefa` lê: sem marca, libera (branch antiga não fica refém); `concluida`, recusa (não empilhar tarefa nova sobre tarefa encerrada).

## Brainstorm → spec
Skill `superpowers:brainstorming` antes de qualquer feature; spec em `specs/` com o critério de "pronto" checável. **Defeito de origem:** implementação que fechava bem na explicação e não era o que o dono pediu.

## Implementar
Escada da preguiça (pula → reusa → stdlib → dependência → escreve), TDD, mudança cirúrgica. Tarefa grande vira **onda paralela** (`.claude/rules/ondas-paralelas.md`): só tarefas com conjuntos de arquivos disjuntos correm juntas, e nenhuma commita sozinha.

## `npm run gates`
Todos os gates, em paralelo, acumulando falhas. **Defeito de origem:** uma cadeia `&&` de 190 passos parava no primeiro vermelho e escondeu 187 gates; à noite escondeu justamente o que barraria uma regressão.

## `npm run meta-gate`
Cada gate prova que fica vermelho com o defeito real injetado (mutação declarada em `scripts/mutacoes.mjs`). **Defeito de origem:** doze gates nasceram cegos, dez pela mesma causa (âncora de texto frouxa casando no lugar errado). Gate com premissa errada não fica cego: fica do lado errado, com autoridade.

## Revisar em painel
Antes de commitar mudança não trivial: revisores independentes em paralelo (qualidade, segurança, tipagem, framework, silent-failure), cada achado com cenário de falha; síntese deduplica e ranqueia. Frontend se prova no navegador com `agent-browser` (snapshot da árvore de acessibilidade, não pixel). **Defeito de origem:** um revisor só favorece a própria lente; segurança não pega regra de hook, e vice-versa.

## Commit e push da branch
Um commit atômico, Conventional Commits, `git add` seletivo por caminho (subagente ou meta-gate pode ter deixado arquivo mutado). Push da branch, não da principal.

## Perguntar ao dono
Integrar é decisão dele. Relatório curto em markdown: feito, no ar × só salvo, falta, deu errado.

## `npm run integrar`
Fila FIFO por máquina → fetch → rebase → **gates sobre a base nova** → push; rejeitado, reinicia do fetch. Conflito aborta e devolve. **Defeito de origem:** um rebase de 65 commits com 11 conflitos passou em tudo e apagou três peças que o dono tinha aprovado olhando a tela. E seis `integrar` rodando juntos custaram 38 minutos e três tentativas para UMA integração passar.

## `npm run tarefa -- concluir`
Marca a branch; a próxima edição nela é recusada. O hook `fim-de-tarefa` só fala quando há commits prontos e não integrados. **Defeito de origem:** nove commits publicados na branch ficaram dias sem integrar e ninguém percebeu, porque nada falha.

## Registrar
Skill `extract-approach`: nota em `learnings/`. Regra durável vai para o `CLAUDE.md`. Solução sem nota é trabalho inacabado.

## As três invariantes
1. **O que sobe é exatamente o que foi validado.** Qualquer rejeição reinicia do fetch, nunca dos gates.
2. **Regra que depende de alguém lembrar já falhou.** O que muda o futuro é o mecanismo: hook, gate, script.
3. **Se não é seu, não se preocupe.** Avise e siga.
