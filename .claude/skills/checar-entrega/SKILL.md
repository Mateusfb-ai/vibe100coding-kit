---
name: checar-entrega
description: Gate de qualidade antes de mandar QUALQUER entregável ao dono ou publicar (feature, tela, texto, relatório). Roda a régua do projeto e os mínimos de segurança. Trigger: "tá pronto?", "pode publicar?", "entrega isso", "revisa".
user-invocable: true
---

# Skill: checar-entrega

Nada vai ao dono sem passar aqui. Responda cada item com evidência (comando rodado, número medido, print), nunca com adjetivo.

## 1. A régua do projeto
- Leia `CLAUDE.md` → "Régua de qualidade" (ou `docs/REGRA.md`). Cada critério é checável; marque cada um.
- `npm run gates` verde **colado** (não prometido). Gate novo tem mutação em `scripts/mutacoes.mjs` e `npm run meta-gate` verde.

## 2. Os quatro mínimos de segurança (software que vai ao ar)
- Segredo só em env (nunca no código, nunca no cliente).
- Toda rota que lê dado de alguém confere **auth + dono** (anti-IDOR).
- Rate-limit no que custa dinheiro ou tempo.
- Dado pessoal: só o necessário, com prazo de vida e caminho de exclusão.

## 3. Texto que a pessoa lê
- Sem travessão, sem jargão, sem "cara de IA" (passou por `humanizer` se é copy).
- Número medido no lugar de adjetivo.

## 4. O que não foi feito
- Liste o que ficou em aberto e de quem é (meu × outra sessão × dono).
- Nada de "melhorei no caminho": o que o dono aprovou vai verbatim.

## Saída
Relatório curto em markdown (cabe numa tela): feito · no ar × só salvo · falta · deu errado. Só então entregue.
