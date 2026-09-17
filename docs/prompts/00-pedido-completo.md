# O pedido completo (um prompt, do zero ao integrado)

Um prompt só, do brainstorm à entrega testada. As duas primeiras linhas descrevem a tarefa (aqui, um exemplo fictício); o resto é o fluxo e não muda.

```
/brainstorming
Quero adicionar login com Google no app: botão na tela de entrar, callback OAuth,
criação da conta na primeira vez e vínculo com conta já existente pelo e-mail.

Planeje tudo com /writing-plans e implemente tudo com /subagent-driven-development.
Sempre que der, trabalhe em paralelo com /dispatching-parallel-agents (ondas com arquivos disjuntos).

Depois do brainstorming, tire todas as suas dúvidas de uma vez, aprove o plano
e execute até o fim sem me perguntar mais nada. Me entregue pronto, validado e
testado: gates verdes colados, gate novo com mutação e meta-gate verde.
Para testar o frontend use o agent-browser (Vercel). Antes de integrar, rode
o code-review em painel e corrija todo CRÍTICO e ALTO.
```

**Legenda: o que muda e o que fica**

| Trecho | O que é | Muda? |
|---|---|---|
| `/brainstorming` | A skill que abre o ciclo: perguntas antes de código | 🟢 **Fica** (troque por `/systematic-debugging` só se for bug) |
| `Quero adicionar login com Google … pelo e-mail.` | **A sua tarefa**, no lugar do exemplo fictício. Diga o resultado que quer ver, com os limites (o que entra, o que não entra) | 🔴 **Muda sempre**: é a única parte que você escreve |
| `Planeje tudo com /writing-plans e implemente tudo com /subagent-driven-development.` | O caminho plano → execução por subagentes, um passo verificável por vez | 🟢 Fica |
| `Sempre que der, trabalhe em paralelo com /dispatching-parallel-agents (ondas com arquivos disjuntos).` | Autoriza ondas paralelas, com a única condição que as torna seguras | 🟢 Fica (apague se a tarefa é pequena e cabe num agente só) |
| `Depois do brainstorming, tire todas as suas dúvidas de uma vez, aprove o plano e execute até o fim sem me perguntar mais nada.` | Uma rodada de perguntas, depois autonomia. É o "prosseguir é prosseguir" | 🟡 Ajuste: se quiser aprovar o plano você mesmo, troque por "me mostre o plano e espere meu ok" |
| `Me entregue pronto, validado e testado: gates verdes colados, gate novo com mutação e meta-gate verde.` | O critério de pronto do kit: prova colada, não promessa | 🟢 Fica |
| `Para testar o frontend use o agent-browser (Vercel).` | Como provar a tela de verdade | 🟡 Ajuste: apague se não há frontend; troque pela superfície de navegador da sua sessão se preferir |
| `Antes de integrar, rode o code-review em painel e corrija todo CRÍTICO e ALTO.` | A revisão com lentes independentes antes do commit | 🟢 Fica |

Regra prática: **só a segunda linha é sua**. O resto é o fluxo do kit; cada frase existe porque um passo pulado já custou caro.


## Por que funciona

- `/brainstorming` força a pergunta certa ANTES do código (uma por vez, só o que não dá para resolver lendo o repo).
- `/writing-plans` produz um plano com passos verificáveis; `/subagent-driven-development` executa um passo por subagente, com revisão entre eles.
- `/dispatching-parallel-agents` só entra quando as tarefas não dividem arquivo (regra de `.claude/rules/ondas-paralelas.md`).
- "Sem me perguntar mais nada" é o **prosseguir é prosseguir**: a peça que faltar no caminho se constrói. Exceção: valor aprovado e ação destrutiva continuam pedindo confirmação.
- "Pronto, validado e testado" é o critério do `checar-entrega`: prova colada, não promessa.

## Variações

| Situação | Troque a primeira linha por |
|---|---|
| Bug | `/systematic-debugging` + "reproduza antes de consertar; teste que falha, depois passa" |
| Só planejar | pare em `/writing-plans` e peça o plano em `specs/` |
| Tarefa mecânica em muitos arquivos | `/dispatching-parallel-agents` direto, com a lista de `Files:` por onda |
