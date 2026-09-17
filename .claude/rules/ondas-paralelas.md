# Ondas paralelas de subagentes

> Origem: `templates/rules/parallel-subagent-driven-development.md` do
> [vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit),
> adaptado às regras do projeto .
> Complementa a skill `superpowers:subagent-driven-development`, que despacha
> UM implementador por vez — esta regra descreve quando despachar vários em
> paralelo continua seguro.

## O problema

Despacho serial (um implementador, uma tarefa, um commit, depois a próxima) é
correto e lento. Despachar tudo em paralelo é rápido e inseguro por dois
motivos, e só dois:

- dois agentes editam o MESMO arquivo ao mesmo tempo e a escrita de um apaga a
  do outro, em silêncio;
- dois agentes correm para o `git commit`, misturando mudanças não
  relacionadas ou commitando contra um `HEAD` velho.

## Por que a versão paralela é segura

Os dois modos de falha são removidos por MECANISMO, não por disciplina:

- **Colisão de arquivo** — uma onda só se forma com tarefas cujos conjuntos de
  arquivos são totalmente disjuntos. Havendo qualquer sobreposição possível,
  elas nunca entram na mesma onda.
- **Corrida de commit** — **dentro de uma onda**, implementador NÃO commita. Ele
  deixa a mudança na árvore de trabalho e reporta os arquivos que tocou; quem
  commita é o orquestrador, uma tarefa por vez, depois que a onda inteira termina.

🔴 **E ISSO VALE PARA A ONDA, NÃO PARA O AGENTE SOZINHO (decisão do dono,
2026-08-22, literal: "conserta e commita").** A proibição existe por um motivo
medido, e o motivo é a CORRIDA: dois agentes indo ao `git commit` ao mesmo tempo
misturam mudança não relacionada e commitam contra um `HEAD` velho. Despachado
sozinho, não há com quem correr, e devolver a mudança para o orquestrador
commitar só acrescenta um passo.

| situação | commita? | por quê |
|---|---|---|
| agente despachado SOZINHO numa tarefa | **sim** | não há corrida, e é a decisão do dono |
| agente dentro de uma onda paralela | **não** | o motivo medido acima continua de pé |

⚠️ **Quem sabe em qual dos dois o agente está é QUEM DESPACHA**, então o despacho
de onda diz por extenso *"você está numa onda, não commite"*. E o agente, na
dúvida, NÃO commita: errar para esse lado custa uma ação do orquestrador; errar
para o outro custa trabalho alheio, que o CLAUDE.md do `CLAUDE.md` registra como o pior
desfecho desta base.

⚠️ **Os quatro casos de parada continuam valendo mesmo sozinho** (estão escritos
dentro de cada agente): valor que o dono aprovou, território de outra sessão,
ação destrutiva, e onda paralela.

## Marcação de tarefa

No plano, toda tarefa carrega dois campos:

- **`Files:`** — os caminhos ou globs exatos que a tarefa cria ou modifica.
- **`Depends-on:`** — os IDs das tarefas cuja saída ela consome, ou `none`.

Faltando qualquer um dos dois, ou havendo incerteza real sobre o que a tarefa
toca, ela recebe `Depends-on: tudo que já foi listado`. Essa é a rede de
segurança: tarefa mal especificada degrada para execução SERIAL, nunca vira
paralelismo falso. Nunca chute um escopo mais estreito do que você sabe.

## Regra de formação da onda

Duas tarefas entram na mesma onda se, e somente se, as DUAS condições valerem:

1. nenhuma está na cadeia de `Depends-on` da outra, nem transitivamente;
2. os conjuntos de `Files` são totalmente disjuntos.

Falhou uma, a tarefa vai para a onda seguinte. Uma cadeia linear degrada para
uma tarefa por onda — idêntico ao serial, sem regressão.

## Laço de execução por onda

1. Escreva um arquivo de instruções por tarefa da onda.
2. Despache todos os implementadores da onda **numa única mensagem**. É o único
   ponto onde o paralelismo acontece.
3. Implementadores **não commitam**. Cada um deixa a mudança na árvore e
   reporta quais arquivos tocou.
4. O orquestrador commita por tarefa, na ordem da onda, capturando o `HEAD`
   atual imediatamente antes de cada commit — nunca uma referência velha.
5. Só então despache os revisores da onda, também juntos. É seguro porque
   revisão é somente leitura, cada revisor no intervalo de commit da sua tarefa.
6. Faça UM registro de progresso por onda, nunca um por tarefa — duas escritas
   concorrentes no mesmo log são a mesma classe de bug do commit disputado.

## Válvula de escape

Quando duas tarefas genuinamente não conseguem evitar o mesmo arquivo, não as
force na mesma onda: isole cada implementadora na própria worktree
(`npm run sessao -- <tipo>/<tarefa>`), onde commitar sozinha volta a ser
seguro. É caro — disco e configuração por agente — e é último recurso.

## O que esta regra NÃO muda

- **Os gates e a integração continuam iguais** (`CLAUDE.md` o CLAUDE.md): `npm run gates`
  + `npm run gate:limpeza` antes do commit, `npm run integrar` para publicar,
  nunca `git push <branch>:main` na mão, e a integração é decisão do dono.
- **O território entre sessões continua valendo**: onda paralela é dentro
  da SUA árvore, não licença para atravessar o território de outra sessão.
- **O contrato do implementador não muda** — perguntar antes se a tarefa for
  ambígua, TDD, autorrevisão antes de reportar, status explícito no fim. É o
  contrato da própria skill do Superpowers.
- **Quem escolhe o especialista** continua sendo `roteamento-de-especialistas.md`.

Isto muda só quantas tarefas rodam ao mesmo tempo, e quem pode commitar.
