---
name: sync-main
description: Publica trabalho na branch principal com disciplina, rebase antes, gates sobre a base nova, um push por vez. Use SEMPRE antes de levar trabalho pro main. Trigger: "sobe pro main", "publica", "commita e sobe", "leva pro main", "integra".
user-invocable: true
---

# Skill: sync-main (publicar com disciplina)

O caminho é UM: `npm run integrar`. Ele faz, nesta ordem, e reinicia do começo se a principal andar no meio:

1. recusa se você está na principal, com HEAD solto ou com árvore suja;
2. entra na fila FIFO da máquina (uma integração por vez);
3. `git fetch` + `git rebase origin/<principal>`; **conflito aborta e devolve** (dois códigos válidos não se resolvem às pressas: válido não é aprovado);
4. roda os gates **sobre a base nova**;
5. `git push origin <branch>:<principal>`; rejeitado = a principal andou = volta ao passo 3.

## Antes de chamar

- `git add` seletivo por caminho (nunca `-A` cego: subagente ou meta-gate pode ter deixado arquivo mutado na árvore).
- Um commit atômico por tarefa, Conventional Commits, sem trailer de coautoria.
- Se o diff mostra centenas de deleções que você não fez, a branch é stale: rebase ou descarta, não integra.
- **Pergunte ao dono** se ele quer integrar. É decisão dele.

## Depois

- Push aceito não é deploy feito: confira o ambiente publicado.
- `npm run tarefa -- concluir` marca a branch; o hook passa a recusar edição nela (próxima tarefa = branch nova).
- Relatório curto em markdown ao dono: o que mudou, o que está no ar, o que falta.

## Nunca

`git push origin <branch>:main` na mão · `--no-verify` por hábito · resolver conflito sem ler os dois lados · integrar trabalho de outra sessão.
