# Prompt dinâmico (o de todo dia)

Um prompt só, do brainstorm à entrega testada. Troque apenas o que está entre colchetes; o resto é o fluxo.

```
/brainstorming
TROQUE AQUI: [Preciso que você integre com o Resend para verificar o e-mail no cadastro do usuário]

Planeje tudo com /writing-plans e implemente tudo com /subagent-driven-development.
Sempre que der, trabalhe em paralelo com /dispatching-parallel-agents (ondas com arquivos disjuntos).

Depois do brainstorming, tire todas as suas dúvidas de uma vez, aprove o plano
e execute até o fim sem me perguntar mais nada. Me entregue pronto, validado e
testado: gates verdes colados, gate novo com mutação e meta-gate verde.
Para testar o frontend use o agent-browser (Vercel). Antes de integrar, rode
o code-review em painel e corrija todo CRÍTICO e ALTO.
```

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
