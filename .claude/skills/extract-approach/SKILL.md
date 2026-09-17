---
name: extract-approach
description: Depois de resolver qualquer problema não-trivial, documenta a abordagem pra um modelo menos capaz replicar o raciocínio. Dispara depois de debugging, decisão de arquitetura, build difícil, ou qualquer solução que exigiu raciocínio de verdade. Use ao terminar de rachar um problema, ao pedir "documenta isso", "salva o aprendizado", ou antes de seguir pra próxima tarefa.
user-invocable: true
disable-model-invocation: false
---

# Skill: extract-approach (o gravador)

Depois de resolver um problema difícil, **antes de seguir**, escreva uma nota em `learnings/<data>-<slug>.md` (data = AAAA-MM-DD; slug = kebab curto).

Estrutura (mantenha abaixo de uma página):

```markdown
# <problema em uma linha>
Data: <AAAA-MM-DD> · Área: <front / api / banco / infra / git / produto>

## O problema
<1 linha: o que estava quebrado ou o que precisava ser decidido>

## A abordagem
<como o problema foi decomposto, em passos simples e numerados que um modelo
mais fraco consiga repetir do zero>

## Decisões de julgamento
<o que foi deliberadamente NÃO feito, e por quê. As armadilhas evitadas.>

## Regra reusável
<o princípio de UMA linha que um modelo futuro deve aplicar quando sentir um
problema parecido. Se der, ligue com [[outra-nota]] relacionada.>
```

## Princípios
- Escreva pra um modelo **mais fraco** lendo do zero conseguir seguir o mesmo caminho.
- Uma solução sem a nota é **trabalho inacabado** (lei do aprendizado).
- Se o aprendizado for uma regra durável do projeto (não um caso único), além da nota, considere refletir no `CLAUDE.md` (erros recorrentes ou régua) ou no `produtos/<id>/REGRAS.md` certo.
- Não duplique: se já existe nota do mesmo problema, atualize-a.
