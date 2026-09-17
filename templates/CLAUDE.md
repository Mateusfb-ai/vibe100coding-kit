# CLAUDE.md — <NOME DO PROJETO>

Idioma: **sempre pt-BR**. Regra de ouro: **agir > perguntar**, mas só depois de ler as fontes da verdade.

> Este arquivo é o mínimo que toda sessão precisa: O QUE fazer. COMO raciocinar
> está em [`docs/CEREBRO-AGENTE.md`](docs/CEREBRO-AGENTE.md). O histórico medido
> de cada decisão fica em `learnings/` e `docs/DECISOES.md`, lidos sob demanda.

---

## Contexto arquitetônico

<O que o produto é em duas frases: o que faz e o que NÃO faz. Stack em 5 linhas
(front, api, dados, infra, integrações). URL de produção.>

---

## Comandos principais

```bash
npm run sessao -- <tipo>/<tarefa>   # abre worktree próprio (OBRIGATÓRIO com várias sessões)
npm run tarefa -- abrir|estado|concluir
npm run gates                       # todos os gates, em paralelo, acumulando falhas
npm run meta-gate                   # prova que cada gate fica vermelho com o defeito real
npm run integrar                    # rebase → gates sobre a base nova → push, em fila
graphify query "<pergunta>"         # consulte ANTES de responder sobre arquitetura
```

<Comandos do produto: subir, migrar banco, build.>

---

## Convenções e estilo

- **`src/` não carrega comentário, emoji nem procedência de ferramenta.** O porquê vai para `docs/DECISOES.md`. Diretiva de compilador não é comentário.
- **Nenhum texto que a pessoa lê carrega travessão.** Vírgula, dois pontos, ponto ou parênteses.
- **Uma worktree por sessão, uma tarefa por branch, um commit atômico por tarefa.** Nunca na `main`. Conventional Commits em pt-BR, sem trailer de coautoria.
- **`git add` seletivo por caminho**, nunca por diretório.
- **Env nova entra no `.env.example` no mesmo commit.**
- <Convenções próprias: rota nova atualiza o mapa; tabela nova nasce com RLS; etc.>

---

## As quatro leis

1. **Hipótese não é resposta.** Nunca descartar caminho por risco não medido, nunca aplicar mudança porque a explicação fecha bem. A frase permitida é *"não medi; custa X medir, quer que eu meça?"*.
2. **Se existe uma decisão, use a decisão.** Valor, limiar, parâmetro: se há decisão do dono ou medição, usa-se; se não há, mede-se. **Nunca se escolhe.** Medição que contradiz o aprovado se APRESENTA, não se aplica.
3. **Nada fica só no chat.** Decisão medida vai para `docs/` ou `learnings/`. O que não está escrito, a próxima sessão inventa de novo com a mesma confiança.
4. **Gate que não sabe dizer como se prova não protege nada.** Gate novo nasce com a mutação declarada em `scripts/mutacoes.mjs`, provada injetando o defeito REAL. Gate removido é declarado em `scripts/gates-removidos.txt` com o motivo.

---

## Erros que um modelo mais fraco comete aqui — e a regra que previne

| # | Erro | O que faz de errado | Regra que previne |
|---|---|---|---|
| 1 | **Número datado como estado** | cita um número de um doc antigo como se fosse hoje | Número com data é HISTÓRICO. Para saber quanto é hoje, mede-se. |
| 2 | **Árvore velha** | inventaria/audita numa árvore N commits atrás da main | `git rev-list --count HEAD..origin/main` antes de medir; saia para uma árvore atualizada. |
| 3 | **Vermelho = veredito** | vê gate vermelho e "conserta" | Vermelho é dado. Três causas pedem ações opostas: defeito, pré-condição ausente, disputa entre sessões. Rode isolado antes de concluir. |
| 4 | **Gate que lê intenção** | gate confere presença de mecanismo, não resultado | Âncora no menor escopo que contém a decisão; nunca no nome, nunca no arquivo inteiro. |
| 5 | **Push = deploy** | dá push e diz "está no ar" | Push aceito não é deploy feito. Confira o ambiente. |
| 6 | <erro do projeto> | <o que faz> | <regra> |

---

## Régua de qualidade por entregável (critério checável, não adjetivo)

**Código**
- [ ] `npm run gates` verde colado; gate novo com mutação e `npm run meta-gate` verde.
- [ ] Sem comentário em `src/`; sem travessão em texto exibido.
- [ ] Segredo em env · auth + dono em toda rota de dado alheio · rate-limit no que custa · dado pessoal com prazo e exclusão.

**Commit**
- [ ] `tipo(escopo): descrição` em pt-BR · `git add` seletivo · rebase antes do push (skill `sync-main`).

<Régua por tipo de entregável do projeto: tela, e-mail, relatório…>

Qualquer entregável antes de ir ao dono → skill `checar-entrega`.

---

## Em dúvida — escalada

1. Antes de perguntar o dono, leia: este arquivo → `docs/REGRA.md` → `docs/CEREBRO-AGENTE.md` → `learnings/`. Se está lá, a dúvida acabou.
2. Docs se contradizem → o mais específico e mais recente vence; doc × código → o **código** vence e o doc é sinalizado.
3. Ação destrutiva ou externa (reset, apagar, publicar, deploy, mandar mensagem) → confirma com o dono.
4. Reversível e dentro do pedido → age, não pergunta.
5. Pedido de prosseguir autoriza construir a peça que faltar no caminho.

---

## Lei do aprendizado

Depois de todo problema não trivial resolvido, skill `extract-approach`: nota em `learnings/<data>-<slug>.md`. Solução sem a nota é trabalho inacabado.
