# Prompt: despachar uma onda paralela

```
Tarefa grande: <descrição>. Leia .claude/rules/ondas-paralelas.md e
roteamento-de-especialistas.md.

1. Decomponha por FRONTEIRA DE CONTEXTO ISOLÁVEL (o que cada parte precisa
   saber para trabalhar sozinha), nunca por tema nem por fase.
2. Para cada parte, liste Files: (o conjunto exato de arquivos que ela toca).
3. Forme a onda só com partes cujos Files: são disjuntos. As que colidem
   entram na onda seguinte, ou viram onda de investigação (leitura em
   paralelo, escrita serial).
4. Despache com camada de modelo explícita (rápida / intermediária / forte).
   Nenhum subagente commita: quem integra é a sessão principal, um commit
   atômico por tarefa.
5. Ao fim de cada onda: npm run gates, revisão do diff, e só então a próxima.

Mostre o plano de ondas antes de despachar a primeira.
```
